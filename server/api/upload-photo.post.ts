export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')

  if (!file || !file.data?.length) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const ext = file.filename?.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const response = await fetch(`${supabaseUrl}/storage/v1/object/truck-photos/${path}`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file.data
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to upload photo' })
  }

  return { url: `${supabaseUrl}/storage/v1/object/public/truck-photos/${path}` }
})
