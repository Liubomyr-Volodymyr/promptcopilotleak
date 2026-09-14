'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import {Label} from "@/components/ui/label";

type UserPrompt = {
  id: string
  key: string
  content?: string
  createdAt?: string
  updatedAt?: string
}

type LlmConfigResponse = {
  id: string
  key: string
  model: string
  defaults: {
    temperature: number
    topP: number
  }
  systemPrompt?: UserPrompt
  createdAt?: string
  updatedAt?: string
}

export default function SystemPromptsPage() {
  const [key, setKey] = useState('autocomplete')
  const [model, setModel] = useState('groq-oss')
  const [temperature, setTemperature] = useState<number>(0.2)
  const [topP, setTopP] = useState<number>(1)
  const [statusUpdate, setStatusUpdate] = useState('')

  const [fileKey, setFileKey] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string>('')
  const [statusFile, setStatusFile] = useState('')

  const [meta, setMeta] = useState<{ createdAt?: string; updatedAt?: string; promptId?: string } | null>(null)

  useEffect(() => {
    let mounted = true
    const loadConfig = async () => {
      try {
        setStatusUpdate('Loading...')
        const data: LlmConfigResponse = await apiFetch(`/admin/manage-prompts/llm/${encodeURIComponent(key)}`, {
          headers: { accept: 'application/json' },
        })
        if (!mounted) return
        if (data) {
          setModel(data.model ?? '')
          setTemperature(data.defaults?.temperature ?? 0.2)
          setTopP(data.defaults?.topP ?? 1)
          setPreviewContent(data.systemPrompt?.content ?? '')
          setMeta({ createdAt: data.createdAt, updatedAt: data.updatedAt, promptId: data.systemPrompt?.id })
          setStatusUpdate('')
        } else {
          setStatusUpdate('No config')
        }
      } catch (err) {
        setStatusUpdate('Failed to load')
        setMeta(null)
      }
    }
    loadConfig()
    return () => {
      mounted = false
    }
  }, [key])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusUpdate('Saving...')
    try {
      const payload = {
        key,
        model,
        defaults: { temperature: Number(temperature), topP: Number(topP) },
      }
      const res = await apiFetch('/admin/manage-prompts/llm/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res && (res as any).id) {
        setStatusUpdate('Saved')
        setMeta(prev => ({ ...(prev ?? {}), updatedAt: (res as any).updatedAt }))
      } else {
        setStatusUpdate('Saved (unknown response)')
      }
    } catch {
      setStatusUpdate('Error saving')
    }
  }

  const handleFileChange = (f: File | null) => {
    setFile(f)
    if (f) {
      setFileName(f.name)
      const reader = new FileReader()
      reader.onload = () => setPreviewContent(String(reader.result || ''))
      reader.readAsText(f, 'utf-8')
    } else {
      setFileName(null)
      setPreviewContent('')
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusFile('Uploading...')
    try {
      const currentKey = fileKey || key
      if (file) {
        const fd = new FormData()
        fd.append('key', currentKey)
        fd.append('file', file)
        const res = await apiFetch('/admin/manage-prompts/llm/prompt/file', {
          method: 'PUT',
          body: fd as unknown as BodyInit,
        })
        if (res && (res as any).status === 'error') {
          setStatusFile('Error uploading file')
        } else {
          setStatusFile('Uploaded file')
          const parsed: LlmConfigResponse = await apiFetch(`/admin/manage-prompts/llm/${encodeURIComponent(currentKey)}`, { headers: { accept: 'application/json' } })
          if (parsed) {
            setPreviewContent(parsed.systemPrompt?.content ?? '')
            setMeta({ createdAt: parsed.createdAt, updatedAt: parsed.updatedAt, promptId: parsed.systemPrompt?.id })
          }
        }
        return
      }
      const payload = { key: currentKey, content: previewContent }
      const res = await apiFetch('/admin/manage-prompts/llm/prompt/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res && (res as any).id) {
        setStatusFile('Saved prompt content')
        const parsed: LlmConfigResponse = await apiFetch(`/admin/manage-prompts/llm/${encodeURIComponent(currentKey)}`, { headers: { accept: 'application/json' } })
        if (parsed) {
          setPreviewContent(parsed.systemPrompt?.content ?? '')
          setMeta({ createdAt: parsed.createdAt, updatedAt: parsed.updatedAt, promptId: parsed.systemPrompt?.id })
        }
      } else {
        setStatusFile('Saved (unknown response)')
      }
    } catch {
      setStatusFile('Error uploading')
    }
  }

  return (
      <main className="px-4 py-6 mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-6">System Prompts — Admin</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <section className="w-full border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-medium mb-3">LLM Config</h2>
              <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                <input
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="key"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                />
                <input
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder="model"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Label>temp</Label>
                  <input
                      type="number"
                      step="0.01"
                      value={temperature}
                      onChange={e => setTemperature(Number(e.target.value))}
                      placeholder="temperature"
                      className="w-full sm:flex-1 border rounded-md px-3 py-2 text-sm"
                  />
                  <Label>topP</Label>
                  <input
                      type="number"
                      step="0.01"
                      value={topP}
                      onChange={e => setTopP(Number(e.target.value))}
                      placeholder="topP"
                      className="w-full sm:flex-1 border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-1">
                  <button type="submit" className="w-full sm:w-auto flex-1 bg-blue-600 text-white px-4 py-2 rounded-md">
                    Save
                  </button>
                  <button
                      type="button"
                      onClick={() => {
                        setModel('')
                        setTemperature(0.2)
                        setTopP(1)
                        setPreviewContent('')
                        setFile(null)
                        setFileName(null)
                        setFileKey('')
                        setStatusFile('')
                      }}
                      className="w-full sm:w-auto flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {statusUpdate && <p className="mt-3 text-sm text-gray-600">{statusUpdate}</p>}

              {meta && (
                  <div className="mt-3 text-sm text-gray-500 space-y-1">
                    <div>Config created: {meta.createdAt ?? '—'}</div>
                    <div>Last updated: {meta.updatedAt ?? '—'}</div>
                    <div>Prompt id: {meta.promptId ?? '—'}</div>
                  </div>
              )}
            </section>

            <section className="w-full border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-medium mb-3">Prompt Upload / Edit</h2>
              <form onSubmit={handleFileUpload} className="flex flex-col gap-3">
                <input
                    value={fileKey}
                    onChange={e => setFileKey(e.target.value)}
                    placeholder="prompt key (overrides key above)"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                />

                <label className="flex items-center gap-3">
                  <input
                      type="file"
                      onChange={e => handleFileChange(e.target.files ? e.target.files[0] : null)}
                      className="text-sm"
                  />
                  <span className="text-sm text-gray-600 truncate max-w-[60%]">{fileName ?? 'No file selected'}</span>
                </label>

                <textarea
                    value={previewContent}
                    onChange={e => setPreviewContent(e.target.value)}
                    placeholder="Prompt content"
                    rows={8}
                    className="w-full border rounded-md px-3 py-2 text-sm resize-vertical max-h-60 overflow-auto"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" className="w-full sm:w-auto flex-1 bg-green-600 text-white px-4 py-2 rounded-md">
                    Upload / Save
                  </button>
                  <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setFileName(null)
                        setPreviewContent('')
                      }}
                      className="w-full sm:w-auto flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Clear
                  </button>
                </div>
              </form>

              {statusFile && <p className="mt-3 text-sm text-gray-600">{statusFile}</p>}
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="w-full border rounded-lg p-4 bg-white shadow-sm flex flex-col">
              <h2 className="text-lg font-medium mb-3">Preview</h2>
              <div className="flex-1 border rounded-md p-3 overflow-auto whitespace-pre-wrap break-words bg-gray-50 max-h-[60vh]">
                {previewContent ? (
                    <div className="text-sm leading-relaxed">{previewContent}</div>
                ) : (
                    <div className="text-sm text-gray-400">No prompt content loaded</div>
                )}
              </div>
            </section>

            <section className="w-full border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-medium mb-3">Current payloads</h2>
              <pre className="text-xs bg-lime-50 bg-opacity-5 p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap break-words">
{`LLM update payload:
${JSON.stringify({ key, model, defaults: { temperature, topP } }, null, 2)}

Prompt payload (JSON):
${JSON.stringify({ key: fileKey || key, content: previewContent }, null, 2)}`}
          </pre>
            </section>
          </div>
        </div>
      </main>
  )
}
