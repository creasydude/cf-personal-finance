import { getAuthenticatedUser, jsonError } from './_lib/auth'

// GET /api/attachments?transaction_id=xxx OR /api/attachments?id=xxx&action=data
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const url = new URL(context.request.url)
  const transactionId = url.searchParams.get('transaction_id')
  const id = url.searchParams.get('id')
  const action = url.searchParams.get('action')

  // Download file: /api/attachments?id=xxx&action=data
  if (id && action === 'data') {
    const attachment = await context.env.DB
      .prepare('SELECT * FROM attachments WHERE id = ? AND user_id = ?')
      .bind(id, user.user_id)
      .first<{ id: string; filename: string; content_type: string; size: number; data: string }>()

    if (!attachment) return jsonError('Attachment not found', 404)

    const binaryData = Uint8Array.from(atob(attachment.data), c => c.charCodeAt(0))

    return new Response(binaryData, {
      headers: {
        'Content-Type': attachment.content_type,
        'Content-Disposition': `inline; filename="${attachment.filename}"`,
        'Cache-Control': 'private, max-age=31536000',
      },
    })
  }

  // List attachments: /api/attachments?transaction_id=xxx
  if (!transactionId) return jsonError('transaction_id is required', 400)

  const { results: attachments } = await context.env.DB
    .prepare('SELECT id, filename, content_type, size, created_at FROM attachments WHERE transaction_id = ? AND user_id = ? ORDER BY created_at')
    .bind(transactionId, user.user_id)
    .all()

  return Response.json({ attachments })
}

// POST /api/attachments — upload file
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const formData = await context.request.formData()
  const file = formData.get('file') as File | null
  const transactionId = formData.get('transaction_id') as string | null

  if (!file || !transactionId) {
    return jsonError('file and transaction_id are required', 400)
  }

  // Verify transaction belongs to user
  const txn = await context.env.DB
    .prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?')
    .bind(transactionId, user.user_id)
    .first()
  if (!txn) return jsonError('Transaction not found', 404)

  // Limit: 10MB
  if (file.size > 10 * 1024 * 1024) {
    return jsonError('File size must be under 10MB', 400)
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  const id = `att_${crypto.randomUUID().substring(0, 8)}`
  await context.env.DB
    .prepare('INSERT INTO attachments (id, user_id, transaction_id, filename, content_type, size, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, user.user_id, transactionId, file.name, file.type, file.size, base64)
    .run()

  return Response.json({ id, filename: file.name, content_type: file.type, size: file.size }, { status: 201 })
}

// DELETE /api/attachments?id=xxx
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  if (!id) return jsonError('Attachment id is required', 400)

  const existing = await context.env.DB
    .prepare('SELECT id FROM attachments WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first()
  if (!existing) return jsonError('Attachment not found', 404)

  await context.env.DB
    .prepare('DELETE FROM attachments WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .run()

  return Response.json({ ok: true })
}
