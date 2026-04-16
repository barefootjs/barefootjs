package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"strconv"
	"sync"
	"time"

	bf "github.com/barefootjs/runtime/bf"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// loadTemplates loads all templates with BarefootJS functions registered
func loadTemplates() *template.Template {
	return template.Must(
		template.New("").Funcs(bf.FuncMap()).ParseGlob("dist/templates/*.tmpl"),
	)
}

// EchoRenderer adapts bf.Renderer to Echo's Renderer interface
type EchoRenderer struct {
	bf *bf.Renderer
}

func (r *EchoRenderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	opts := data.(bf.RenderOptions)
	opts.ComponentName = name
	_, err := w.Write([]byte(r.bf.Render(opts)))
	return err
}

// defaultLayout renders the standard HTML page structure
func defaultLayout(ctx *bf.RenderContext) string {
	headingStyle := ""
	headingHTML := ""
	if ctx.Heading != "" {
		headingStyle = `
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    </style>`
		headingHTML = fmt.Sprintf(`
    <h1>%s</h1>`, ctx.Heading)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <title>%s</title>
    <link rel="stylesheet" href="/shared/styles/components.css">
    <link rel="stylesheet" href="/shared/styles/todo-app.css">%s
</head>
<body>%s
    <div id="app">%s</div>
    <p><a href="/">← Back</a></p>
    %s%s
</body>
</html>`, ctx.Title, headingStyle, headingHTML, ctx.ComponentHTML, ctx.Portals, ctx.Scripts)
}

// In-memory todo storage
var (
	todoMutex  sync.RWMutex
	todoNextID = 4
	todos      = []Todo{
		{ID: 1, Text: "Setup project", Done: false, Editing: false},
		{ID: 2, Text: "Create components", Done: false, Editing: false},
		{ID: 3, Text: "Write tests", Done: true, Editing: false},
	}
)

// Reset todos to initial state (for testing)
func resetTodos() {
	todoMutex.Lock()
	defer todoMutex.Unlock()
	todoNextID = 4
	todos = []Todo{
		{ID: 1, Text: "Setup project", Done: false, Editing: false},
		{ID: 2, Text: "Create components", Done: false, Editing: false},
		{ID: 3, Text: "Write tests", Done: true, Editing: false},
	}
}

func main() {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Renderer
	e.Renderer = &EchoRenderer{bf: bf.NewRenderer(loadTemplates(), defaultLayout)}

	// Routes
	e.GET("/", indexHandler)
	e.GET("/counter", counterHandler)
	e.GET("/toggle", toggleHandler)
	e.GET("/todos", todosHandler)
	e.GET("/todos-ssr", todosSSRHandler)
	e.GET("/reactive-props", reactivePropsHandler)
	e.GET("/props-reactivity", propsReactivityHandler)
	e.GET("/form", formHandler)
	e.GET("/portal", portalHandler)
	e.GET("/conditional-return", conditionalReturnHandler)
	e.GET("/conditional-return-link", conditionalReturnLinkHandler)
	e.GET("/ai-chat", aiChatHandler)

	// Todo API endpoints
	e.GET("/api/todos", getTodosAPI)
	e.POST("/api/todos", createTodoAPI)
	e.PUT("/api/todos/:id", updateTodoAPI)
	e.DELETE("/api/todos/:id", deleteTodoAPI)
	e.POST("/api/todos/reset", resetTodosAPI)

	// Static files (for client JS)
	e.Static("/static", "dist")

	// Shared styles
	e.Static("/shared", "../shared")

	e.Logger.Fatal(e.Start(":8080"))
}

func indexHandler(c echo.Context) error {
	return c.HTML(http.StatusOK, `
<!DOCTYPE html>
<html>
<head>
    <title>BarefootJS + Echo Example</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        h1 { color: #333; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    <h1>BarefootJS + Echo Example</h1>
    <p>This example demonstrates server-side rendering with Go Echo and BarefootJS.</p>
    <ul>
        <li><a href="/counter">Counter</a></li>
        <li><a href="/toggle">Toggle</a></li>
        <li><a href="/todos">Todo (@client)</a></li>
        <li><a href="/todos-ssr">Todo (no @client markers)</a></li>
        <li><a href="/ai-chat">AI Chat (Streaming SSR)</a></li>
    </ul>
</body>
</html>
`)
}

func counterHandler(c echo.Context) error {
	props := NewCounterProps(CounterInput{Initial: 0})
	return c.Render(http.StatusOK, "Counter", bf.RenderOptions{
		Props:   &props,
		Title:   "Counter - BarefootJS",
		Heading: "Counter Component",
	})
}

func toggleHandler(c echo.Context) error {
	props := NewToggleProps(ToggleInput{
		ToggleItems: []ToggleItemInput{
			{Label: "Setting 1", DefaultOn: true},
			{Label: "Setting 2", DefaultOn: false},
			{Label: "Setting 3", DefaultOn: false},
		},
	})

	return c.Render(http.StatusOK, "Toggle", bf.RenderOptions{
		Props:   &props,
		Title:   "Toggle - BarefootJS",
		Heading: "Toggle Component",
	})
}

func todosHandler(c echo.Context) error {
	todoMutex.RLock()
	currentTodos := make([]Todo, len(todos))
	copy(currentTodos, todos)
	todoMutex.RUnlock()

	// Count done todos
	doneCount := 0
	for _, t := range currentTodos {
		if t.Done {
			doneCount++
		}
	}

	// Build TodoItemProps array with ScopeID for each item
	todoItems := make([]TodoItemProps, len(currentTodos))
	for i, t := range currentTodos {
		todoItems[i] = TodoItemProps{
			ScopeID: fmt.Sprintf("TodoItem_%d", t.ID),
			Todo:    t,
		}
	}

	props := NewTodoAppProps(TodoAppInput{
		InitialTodos: currentTodos,
	})
	// Manual fields not generated by NewTodoAppProps
	props.Todos = currentTodos  // For client hydration (JSON)
	props.TodoItems = todoItems // For Go template (not in JSON)
	props.DoneCount = doneCount

	return c.Render(http.StatusOK, "TodoApp", bf.RenderOptions{
		Props: &props,
		Title: "TodoMVC - BarefootJS",
	})
}

func reactivePropsHandler(c echo.Context) error {
	props := NewReactivePropsProps(ReactivePropsInput{})
	return c.Render(http.StatusOK, "ReactiveProps", bf.RenderOptions{
		Props:   &props,
		Title:   "Reactive Props - BarefootJS",
		Heading: "Reactive Props Test",
	})
}

func propsReactivityHandler(c echo.Context) error {
	props := NewPropsReactivityComparisonProps(PropsReactivityComparisonInput{})
	return c.Render(http.StatusOK, "PropsReactivityComparison", bf.RenderOptions{
		Props:   &props,
		Title:   "Props Reactivity - BarefootJS",
		Heading: "Props Reactivity Comparison",
	})
}

func formHandler(c echo.Context) error {
	props := NewFormProps(FormInput{})
	return c.Render(http.StatusOK, "Form", bf.RenderOptions{
		Props:   &props,
		Title:   "Form - BarefootJS",
		Heading: "Form Example",
	})
}

func portalHandler(c echo.Context) error {
	props := NewPortalExampleProps(PortalExampleInput{})
	return c.Render(http.StatusOK, "PortalExample", bf.RenderOptions{
		Props:   &props,
		Title:   "Portal - BarefootJS",
		Heading: "Portal Example",
	})
}

func conditionalReturnHandler(c echo.Context) error {
	props := NewConditionalReturnProps(ConditionalReturnInput{})
	return c.Render(http.StatusOK, "ConditionalReturn", bf.RenderOptions{
		Props:   &props,
		Title:   "Conditional Return - BarefootJS",
		Heading: "Conditional Return Example",
	})
}

func conditionalReturnLinkHandler(c echo.Context) error {
	props := NewConditionalReturnProps(ConditionalReturnInput{Variant: "link"})
	return c.Render(http.StatusOK, "ConditionalReturn", bf.RenderOptions{
		Props:   &props,
		Title:   "Conditional Return (Link) - BarefootJS",
		Heading: "Conditional Return Example (Link)",
	})
}

func todosSSRHandler(c echo.Context) error {
	todoMutex.RLock()
	currentTodos := make([]Todo, len(todos))
	copy(currentTodos, todos)
	todoMutex.RUnlock()

	// Count done todos
	doneCount := 0
	for _, t := range currentTodos {
		if t.Done {
			doneCount++
		}
	}

	// Build TodoItemProps array with ScopeID for each item
	todoItems := make([]TodoItemProps, len(currentTodos))
	for i, t := range currentTodos {
		todoItems[i] = TodoItemProps{
			ScopeID: fmt.Sprintf("TodoItem_%d", t.ID),
			Todo:    t,
		}
	}

	props := NewTodoAppSSRProps(TodoAppSSRInput{
		InitialTodos: currentTodos,
	})
	// Manual fields not generated by NewTodoAppSSRProps
	props.Todos = currentTodos  // For client hydration (JSON)
	props.TodoItems = todoItems // For Go template (not in JSON)
	props.DoneCount = doneCount

	return c.Render(http.StatusOK, "TodoAppSSR", bf.RenderOptions{
		Props: &props,
		Title: "TodoMVC SSR - BarefootJS",
	})
}

// Todo API handlers
func getTodosAPI(c echo.Context) error {
	todoMutex.RLock()
	defer todoMutex.RUnlock()
	return c.JSON(http.StatusOK, todos)
}

func createTodoAPI(c echo.Context) error {
	var input struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(c.Request().Body).Decode(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	todoMutex.Lock()
	newTodo := Todo{
		ID:   todoNextID,
		Text: input.Text,
		Done: false,
	}
	todoNextID++
	todos = append(todos, newTodo)
	todoMutex.Unlock()

	return c.JSON(http.StatusCreated, newTodo)
}

func updateTodoAPI(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	var input struct {
		Text *string `json:"text"`
		Done *bool   `json:"done"`
	}
	if err := json.NewDecoder(c.Request().Body).Decode(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	todoMutex.Lock()
	defer todoMutex.Unlock()

	for i, todo := range todos {
		if todo.ID == id {
			if input.Text != nil {
				todos[i].Text = *input.Text
			}
			if input.Done != nil {
				todos[i].Done = *input.Done
			}
			return c.JSON(http.StatusOK, todos[i])
		}
	}

	return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
}

func deleteTodoAPI(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	todoMutex.Lock()
	defer todoMutex.Unlock()

	for i, todo := range todos {
		if todo.ID == id {
			todos = append(todos[:i], todos[i+1:]...)
			return c.NoContent(http.StatusNoContent)
		}
	}

	return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
}

func resetTodosAPI(c echo.Context) error {
	resetTodos()
	return c.NoContent(http.StatusOK)
}

// ---------------------------------------------------------------------------
// AI Chat — Streaming SSR Example
// ---------------------------------------------------------------------------

type ChatMessage struct {
	Role      string `json:"role"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
}

func fetchMockChatHistory() []ChatMessage {
	time.Sleep(1500 * time.Millisecond) // simulate slow DB/API
	return []ChatMessage{
		{Role: "user", Content: "BarefootJSとは何ですか？", Timestamp: "14:01"},
		{Role: "assistant", Content: "BarefootJSは、JSXをMarked Template + Client JSにコンパイルするフレームワークです。Signal-based reactivityをどのバックエンドでも使えるようにします。", Timestamp: "14:01"},
		{Role: "user", Content: "Streaming SSRはどう動きますか？", Timestamp: "14:02"},
		{Role: "assistant", Content: "Out-of-Order Streamingプロトコルを使います。サーバーはまずfallback UIを送信し、データが準備できたら&lt;template&gt;チャンクを追記します。", Timestamp: "14:02"},
		{Role: "user", Content: "どのバックエンドで使えますか？", Timestamp: "14:03"},
		{Role: "assistant", Content: "HTTP chunked transfer encodingをサポートするすべてのバックエンドで動作します。Hono、Go (Echo)、Perl (Mojolicious) などのアダプタが用意されています。", Timestamp: "14:03"},
	}
}

func fetchMockSuggestions() []string {
	time.Sleep(800 * time.Millisecond)
	return []string{
		"コンポーネントの作り方を教えて",
		"Signalの仕組みは？",
		"テストはどう書く？",
	}
}

func renderChatMessages(msgs []ChatMessage) string {
	var html string
	for _, m := range msgs {
		html += fmt.Sprintf(`<div class="chat-msg chat-%s"><div class="chat-bubble"><p>%s</p><time>%s</time></div></div>`, m.Role, m.Content, m.Timestamp)
	}
	return `<div class="chat-messages">` + html + `</div>`
}

func renderSuggestions(qs []string) string {
	var html string
	for _, q := range qs {
		html += fmt.Sprintf(`<button class="suggestion-chip">%s</button>`, q)
	}
	return `<div class="chat-suggestions">` + html + `</div>`
}

func aiChatHandler(c echo.Context) error {
	sr := bf.NewStreamRenderer(loadTemplates(), func(ctx *bf.RenderContext) string {
		return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <title>%s</title>
    <link rel="stylesheet" href="/shared/styles/components.css">
    <link rel="stylesheet" href="/shared/styles/ai-chat.css">
    %s
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    </style>
</head>
<body>
    <h1>AI Chat — Streaming SSR (Go/Echo)</h1>
    <div class="chat-container">
        %s
        %s
        <div class="chat-input-area">
            <input type="text" class="chat-input" placeholder="メッセージを入力..." disabled />
            <button class="chat-send" disabled>送信</button>
        </div>
    </div>

    <div style="margin-top:2rem">
        <h2>Interactive Component (hydrated after streaming)</h2>
        <div id="app">%s</div>
    </div>
    <p><a href="/">← Back</a></p>
    %s%s
</body>
</html>`,
			ctx.Title,
			bf.StreamingBootstrap(),
			// Chat history async boundary (fallback = skeleton)
			bf.BfAsyncBoundary("a0", `<div class="chat-skeleton"><div class="skeleton-msg skeleton-user"><div class="skeleton-line" style="width:60%"></div></div><div class="skeleton-msg skeleton-bot"><div class="skeleton-line" style="width:90%"></div><div class="skeleton-line" style="width:70%"></div></div><div class="skeleton-msg skeleton-user"><div class="skeleton-line" style="width:50%"></div></div><div class="skeleton-msg skeleton-bot"><div class="skeleton-line" style="width:85%"></div><div class="skeleton-line" style="width:60%"></div></div></div>`),
			// Suggestions async boundary
			bf.BfAsyncBoundary("a1", `<div class="suggestions-skeleton"><div class="skeleton-chip"></div><div class="skeleton-chip"></div><div class="skeleton-chip"></div></div>`),
			ctx.ComponentHTML,
			ctx.Portals,
			ctx.Scripts,
		)
	})

	props := NewCounterProps(CounterInput{Initial: 0})

	return sr.Stream(c.Response(), bf.StreamOptions{
		ComponentName: "Counter",
		Props:         &props,
		Title:         "AI Chat — Streaming SSR",
		Boundaries: []bf.AsyncBoundary{
			{
				ID:           "a0",
				FallbackHTML: "",
				Resolve: func() (string, error) {
					msgs := fetchMockChatHistory()
					return renderChatMessages(msgs), nil
				},
			},
			{
				ID:           "a1",
				FallbackHTML: "",
				Resolve: func() (string, error) {
					qs := fetchMockSuggestions()
					return renderSuggestions(qs), nil
				},
			},
		},
	})
}
