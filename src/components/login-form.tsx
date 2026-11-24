"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { login, type LoginState } from "@/app/actions"
import { VitalityLogo } from "@/components/vitality-logo"
import { normalizeToken, TOKEN_LENGTH } from "@/lib/token"

const GROUP_SIZE = 6
const GROUP_COUNT = TOKEN_LENGTH / GROUP_SIZE
const initialState: LoginState = { error: null }

function splitToken(value: string) {
  return Array.from({ length: GROUP_COUNT }, (_, index) =>
    value.slice(index * GROUP_SIZE, (index + 1) * GROUP_SIZE),
  )
}

function hintFor(length: number) {
  const remaining = TOKEN_LENGTH - length
  if (remaining === 0) return "Ready to sign in."
  if (remaining === TOKEN_LENGTH) {
    return "Paste the whole token into any box, or type it in groups of six."
  }
  if (remaining === 1) return "1 character left."
  return `${remaining} characters left.`
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState)
  const [value, setValue] = useState("")
  const [visible, setVisible] = useState(true)
  const [shake, setShake] = useState(false)
  const [hideError, setHideError] = useState(false)
  const wasPending = useRef(false)
  const fields = useRef<Array<HTMLInputElement | null>>([])
  const pastedLength = useRef(0)
  const error = hideError ? null : state.error
  const groups = splitToken(value)
  const ready = value.length === TOKEN_LENGTH && !pending

  useEffect(() => {
    if (wasPending.current && !pending) {
      setHideError(false)
      if (state.error) {
        setShake(true)
        const id = window.setTimeout(() => setShake(false), 420)
        wasPending.current = pending
        return () => window.clearTimeout(id)
      }
    }
    wasPending.current = pending
  }, [pending, state.error])

  function focusGroup(index: number) {
    const field = fields.current[index]
    if (!field) return
    field.focus()
    const end = field.value.length
    field.setSelectionRange(end, end)
  }

  function write(next: string) {
    const token = normalizeToken(next)
    setValue(token)
    setHideError(true)
    return token
  }

  function focusFor(token: string) {
    if (token.length >= TOKEN_LENGTH) {
      focusGroup(GROUP_COUNT - 1)
      return
    }
    focusGroup(Math.floor(token.length / GROUP_SIZE))
  }

  function spreadToken(raw: string) {
    const token = write(raw)
    pastedLength.current = token.length
    focusFor(token)
  }

  function onGroupChange(index: number, raw: string) {
    const cleaned = normalizeToken(raw)
    if (pastedLength.current > GROUP_SIZE && cleaned.length < pastedLength.current) {
      pastedLength.current = 0
      return
    }
    pastedLength.current = 0
    const current = groups[index]

    if (cleaned.length > GROUP_SIZE) {
      spreadToken(cleaned)
      return
    }

    if (cleaned.length > current.length && index * GROUP_SIZE > value.length) {
      const token = write(value + cleaned)
      focusFor(token)
      return
    }

    const parts = splitToken(value)
    parts[index] = cleaned
    write(parts.join(""))
    if (cleaned.length === GROUP_SIZE && index < GROUP_COUNT - 1) {
      focusGroup(index + 1)
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted =
      event.clipboardData.getData("text/plain") ||
      event.clipboardData.getData("text")
    const cleaned = normalizeToken(pasted)
    if (!cleaned) return
    event.preventDefault()
    spreadToken(cleaned)
  }

  function onBeforeInput(
    event: React.FormEvent<HTMLInputElement>,
  ) {
    const native = event.nativeEvent as InputEvent
    if (native.inputType !== "insertFromPaste" && native.inputType !== "insertFromDrop") {
      return
    }
    const cleaned = normalizeToken(native.data ?? "")
    if (cleaned.length <= GROUP_SIZE) return
    event.preventDefault()
    spreadToken(cleaned)
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && groups[index].length === 0 && index > 0) {
      event.preventDefault()
      const parts = splitToken(value)
      parts[index - 1] = parts[index - 1].slice(0, -1)
      write(parts.join(""))
      focusGroup(index - 1)
    }
    if (event.key === "ArrowLeft" && event.currentTarget.selectionStart === 0 && index > 0) {
      event.preventDefault()
      focusGroup(index - 1)
    }
    if (
      event.key === "ArrowRight" &&
      event.currentTarget.selectionStart === event.currentTarget.value.length &&
      index < GROUP_COUNT - 1
    ) {
      event.preventDefault()
      focusGroup(index + 1)
    }
  }

  return (
    <section className="sign-in-glass gate w-full rounded-[28px] px-5 py-8 sm:px-8 sm:py-10">
      <VitalityLogo />
      <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-neutral-950">
        Sign in
      </h1>
      <style>{`
        @keyframes string-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
      <div className="mx-auto mt-3 max-w-[36ch] text-center">
        <p
          className="text-sm font-semibold leading-6 text-neutral-950"
          style={{ animation: "string-blink 2.2s ease-in-out infinite" }}
        >
          Use your 24-character login token.
        </p>
      </div>

      <form action={action} className="mt-7">
        <input type="hidden" name="token" value={value} />

        <div className="flex items-center justify-between gap-3">
          <label id="token-label" className="text-sm font-medium text-neutral-950">
            Login token
          </label>
          <p className="font-mono text-xs tabular-nums text-neutral-800">
            {value.length}
            <span className="text-neutral-600"> / {TOKEN_LENGTH}</span>
          </p>
        </div>

        <div className={shake ? "input-shake mt-3" : "mt-3"}>
          <div
            role="group"
            aria-labelledby="token-label"
            aria-describedby={error ? "token-error" : "token-hint"}
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
          >
            {groups.map((group, index) => {
              const start = index * GROUP_SIZE + 1
              const end = start + GROUP_SIZE - 1
              return (
                <label key={start} className="block">
                  <span className="mb-1.5 block text-center text-[11px] font-medium tracking-wide text-neutral-700">
                    {start}–{end}
                  </span>
                  <input
                    ref={(node) => {
                      fields.current[index] = node
                    }}
                    value={group}
                    autoFocus={index === 0}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="off"
                    inputMode="text"
                    maxLength={index === 0 ? TOKEN_LENGTH : GROUP_SIZE}
                    type={visible ? "text" : "password"}
                    aria-label={`Characters ${start} to ${end}`}
                    aria-invalid={error ? true : undefined}
                    onChange={(event) => onGroupChange(index, event.target.value)}
                    onPaste={onPaste}
                    onBeforeInput={onBeforeInput}
                    onKeyDown={(event) => onKeyDown(index, event)}
                    className={`h-14 w-full rounded-xl border border-white/70 bg-white/70 text-center font-mono text-base text-neutral-950 outline-none transition focus:border-[#F41C5E] focus:bg-white focus:ring-2 focus:ring-[#F41C5E]/30 ${
                      error ? "border-[#F41C5E]" : ""
                    }`}
                  />
                </label>
              )
            })}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <p id="token-hint" className="text-sm leading-5 text-neutral-800">
            {hintFor(value.length)}
          </p>
          <div className="flex justify-end gap-4 text-sm">
            {value.length > 0 ? (
              <button
                type="button"
                className="font-medium text-[#F41C5E] underline-offset-2 hover:underline"
                onClick={() => {
                  write("")
                  focusGroup(0)
                }}
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              className="font-medium text-[#F41C5E] underline-offset-2 hover:underline"
              aria-pressed={visible}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error ? (
          <p id="token-error" role="alert" className="mt-3 text-sm text-[#9f1239]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!ready}
          className={`mt-6 flex h-12 w-full items-center justify-center rounded-full border text-sm font-medium transition ${
            ready
              ? "border-transparent bg-[#F41C5E] text-white hover:bg-[#de1856]"
              : "cursor-not-allowed border-white/80 bg-white/80 text-neutral-800"
          }`}
        >
          {pending ? "Checking" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm font-semibold leading-6 text-neutral-950">
        Contact the hiring team to get this token.
      </p>
    </section>
  )
}
