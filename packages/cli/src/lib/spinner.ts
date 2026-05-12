// Minimal braille-frame spinner for long-running CLI steps.
//
//   const spin = startSpinner({ text: 'Creating starter files...' })
//   await doWork()
//   spin.succeed('Starter files created')
//
// Mirrors the design of `select.ts` / `text.ts`: zero third-party deps,
// non-TTY-safe. When stdout isn't a TTY (CI, piped output) the spinner
// degrades to plain one-line messages so logs stay readable instead of
// being filled with carriage returns.

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export interface Spinner {
  /** Replace the running spinner's label. */
  update(text: string): void
  /** Stop the spinner and print a check-mark line. */
  succeed(text?: string): void
  /** Stop the spinner and print a failure-mark line. */
  fail(text?: string): void
  /** Stop the spinner without printing a finalised state. */
  stop(): void
}

export interface SpinnerArgs {
  text: string
  /** Override stdout for testing. */
  output?: NodeJS.WritableStream & { isTTY?: boolean }
  /** Frame interval in ms (default 80). */
  interval?: number
}

export function startSpinner(args: SpinnerArgs): Spinner {
  const output = (args.output ?? process.stdout) as NodeJS.WritableStream & { isTTY?: boolean }
  const tty = !!output.isTTY
  let text = args.text
  let frame = 0
  let timer: NodeJS.Timeout | null = null

  const clearLine = (): void => {
    output.write('\r\x1b[2K')
  }
  const renderFrame = (): void => {
    clearLine()
    output.write(`${FRAMES[frame]} ${text}`)
    frame = (frame + 1) % FRAMES.length
  }

  if (tty) {
    renderFrame()
    timer = setInterval(renderFrame, args.interval ?? 80)
  } else {
    // Non-TTY: a single line is enough to mark that the step started.
    output.write(`${text}\n`)
  }

  const stopTicker = (): void => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    update(next) {
      text = next
    },
    succeed(next) {
      stopTicker()
      const final = next ?? text
      if (tty) clearLine()
      output.write(`✔ ${final}\n`)
    },
    fail(next) {
      stopTicker()
      const final = next ?? text
      if (tty) clearLine()
      output.write(`✖ ${final}\n`)
    },
    stop() {
      stopTicker()
      if (tty) clearLine()
    },
  }
}
