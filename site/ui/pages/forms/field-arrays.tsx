/**
 * Field Arrays Documentation Page
 *
 * Dynamic list of inputs. createForm covers fixed-shape records — for arrays
 * we pair it with a touched-per-item signal and reuse the same Zod schema.
 */

import { Input } from '@/components/ui/input'
import {
  BasicFieldArrayDemo,
  DuplicateValidationDemo,
  MinMaxFieldsDemo,
} from '@/components/field-arrays-demo'
import {
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { TableOfContents } from '@/components/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'duplicates', title: 'Duplicates', branch: 'child' },
  { id: 'min-max', title: 'Min / Max', branch: 'end' },
]

const basicFieldArrayCode = `import { createForm } from '@barefootjs/form'
import { createSignal } from '@barefootjs/client'
import { z } from 'zod'

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .regex(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, 'Invalid email format')

const validateEmail = (v: string) =>
  emailSchema.safeParse(v).success
    ? ''
    : emailSchema.safeParse(v).error!.issues[0].message

const form = createForm({
  schema: z.object({ emails: z.array(emailSchema).min(1) }),
  defaultValues: { emails: [''] },
  onSubmit: async ({ emails }) => { /* ... */ },
})

const emails = form.field('emails')
const [touched, setTouched] = createSignal<boolean[]>([false])
const [submitAttempted, setSubmitAttempted] = createSignal(false)

const itemError = (i: number) =>
  touched()[i] || submitAttempted() ? validateEmail(emails.value()[i]) : ''

const update = (i: number, v: string) =>
  emails.setValue(emails.value().map((e, idx) => idx === i ? v : e))

const add = () => {
  emails.setValue([...emails.value(), ''])
  setTouched([...touched(), false])
}

const remove = (i: number) => {
  if (emails.value().length > 1) {
    emails.setValue(emails.value().filter((_, idx) => idx !== i))
    setTouched(touched().filter((_, idx) => idx !== i))
  }
}

const handleSubmit = async (e: Event) => {
  setSubmitAttempted(true)
  await form.handleSubmit(e)
}`

const duplicateValidationCode = `// Reuses the per-item schema, then layers a cross-item rule on top.
const itemError = (i: number) => {
  if (!touched()[i]) return ''
  const value = emails.value()[i]
  const basic = validateEmail(value)
  if (basic) return basic
  const lower = value.toLowerCase()
  const isDup = emails.value().some((o, idx) => idx !== i && o.toLowerCase() === lower)
  return isDup ? 'Duplicate email' : ''
}

const duplicateCount = createMemo(() => {
  const values = emails.value().map(v => v.toLowerCase().trim()).filter(v => v !== '')
  return values.length - new Set(values).size
})`

const minMaxFieldsCode = `const form = createForm({
  schema: z.object({
    emails: z.array(emailSchema).min(1).max(5),
  }),
  defaultValues: { emails: [''] },
})

const emails = form.field('emails')
const canAdd = createMemo(() => emails.value().length < 5)
const canRemove = createMemo(() => emails.value().length > 1)

<Button onClick={handleAdd} disabled={!canAdd()}>+ Add Email</Button>
<p>{emails.value().length} / 5 emails</p>`

export function FieldArraysPage() {
  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Field Arrays"
          description="Dynamic list of inputs. createForm holds the array; per-item touched + the same Zod schema power live feedback."
        />

        <Example title="" code={basicFieldArrayCode}>
          <div className="max-w-md">
            <div className="space-y-2">
              <Input placeholder="Email 1" />
              <Input placeholder="Email 2" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              See interactive examples below.
            </p>
          </div>
        </Example>

        <Section id="overview" title="Overview">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              <a href="/docs/forms/create-form" className="text-foreground underline underline-offset-4"><code>createForm</code></a>{' '}
              targets fixed-shape records, so dynamic arrays are stored on a single field
              (<code className="text-foreground">{`emails: z.array(emailSchema)`}</code>) and mutated through{' '}
              <code className="text-foreground">field.setValue([...])</code>. createForm validates the whole array on submit;
              for live per-item feedback, run the same item schema against each value and gate the message
              on a parallel <code className="text-foreground">touched: boolean[]</code> signal.
            </p>
          </div>
        </Section>

        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <div id="basic">
              <Example title="Basic Field Array" code={basicFieldArrayCode}>
                <div className="max-w-md">
                  <BasicFieldArrayDemo />
                </div>
              </Example>
            </div>

            <div id="duplicates">
              <Example title="Duplicate Detection" code={duplicateValidationCode}>
                <div className="max-w-md">
                  <DuplicateValidationDemo />
                </div>
              </Example>
            </div>

            <div id="min-max">
              <Example title="Min / Max Field Constraints" code={minMaxFieldsCode}>
                <div className="max-w-md">
                  <MinMaxFieldsDemo />
                </div>
              </Example>
            </div>
          </div>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
