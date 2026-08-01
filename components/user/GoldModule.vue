<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]

const records = ref([])
const loadingData = ref(true)

// ── Totals ─────────────────────────────────────────────────
const totalGrams = computed(() => records.value.reduce((sum, r) => sum + Number(r.grams), 0))

// ── Fetch ─────────────────────────────────────────────────
const fetchAll = async () => {
  loadingData.value = true
  try {
    records.value = await $fetch('/api/gold-production', { query: { projectId: props.projectId } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load gold production records')
  } finally {
    loadingData.value = false
  }
}

onMounted(fetchAll)

// ── Form ────────────────────────────────────────────────────
const saving = ref(false)
const form = reactive({ grams: '', date: todayISO })

const saveRecord = async () => {
  saving.value = true
  try {
    await $fetch('/api/gold-production', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        grams: Number(form.grams),
        date: form.date
      }
    })
    form.grams = ''
    form.date = todayISO
    await fetchAll()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to record gold production')
  } finally {
    saving.value = false
  }
}

// ── History modal ───────────────────────────────────────────
const showHistory = ref(false)

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
</script>

<template>
  <div class="space-y-8">

    <!-- Loading -->
    <div v-if="loadingData" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
    </div>

    <template v-else>
      <!-- Stats Header -->
      <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-100 shadow-sm border-b-4 border-b-yellow-500">
        <p class="text-xs text-yellow-600 uppercase font-bold mb-1 tracking-wider">Total Gold Produced</p>
        <p class="text-3xl font-bold text-gray-800">{{ totalGrams.toLocaleString(undefined, { maximumFractionDigits: 2 }) }} g</p>
      </div>

      <!-- Gold Entry Form -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-6 flex items-center justify-between flex-wrap gap-y-2">
          <span>🪙 Record Gold Production</span>
          <button type="button" @click="showHistory = true" class="text-xs text-yellow-600 hover:underline">View History</button>
        </h4>
        <form v-if="!readonly" @submit.prevent="saveRecord" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Gold Produced (grams) <span class="text-red-500">*</span></label>
              <input v-model="form.grams" type="number" step="0.01" min="0" required class="w-full border rounded p-2 text-sm" placeholder="e.g. 12.5" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Date <span class="text-red-500">*</span></label>
              <input v-model="form.date" type="date" :max="todayISO" required class="w-full border rounded p-2 text-sm" />
            </div>
          </div>
          <button type="submit" :disabled="saving" class="w-full bg-yellow-600 text-white font-bold py-2 rounded hover:bg-yellow-700 transition shadow-sm disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Record Gold Production' }}
          </button>
        </form>
      </div>
    </template>

    <!-- Gold Production History Modal -->
    <div v-if="showHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-4">Gold Production History</h3>

        <div v-if="records.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No gold production recorded yet.
        </div>

        <div v-else class="space-y-2 overflow-y-auto">
          <div v-for="r in records" :key="r.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
            <p class="text-xs text-gray-400">{{ formatDate(r.date) }}</p>
            <span class="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">{{ Number(r.grams).toLocaleString(undefined, { maximumFractionDigits: 2 }) }} g</span>
          </div>
        </div>

        <div class="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button @click="showHistory = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Close</button>
        </div>
      </div>
    </div>

  </div>
</template>
