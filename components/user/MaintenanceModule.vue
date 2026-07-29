<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]

const records = ref([])
const loadingData = ref(true)

const typeOptions = [
  { value: 'truck', label: 'Truck' },
  { value: 'generator', label: 'Generator' },
  { value: 'plant', label: 'Plant' },
  { value: 'excavator', label: 'Excavator' },
  { value: 'other', label: 'Other Equipment' }
]

const typeLabel = (type) => typeOptions.find(t => t.value === type)?.label || type

// ── Totals ─────────────────────────────────────────────────
const totalCost = computed(() => records.value.reduce((sum, r) => sum + Number(r.cost), 0))

const costByType = computed(() => {
  const totals = { truck: 0, generator: 0, plant: 0, excavator: 0, other: 0 }
  for (const r of records.value) {
    totals[r.type] = (totals[r.type] || 0) + Number(r.cost)
  }
  return totals
})

// ── Fetch ─────────────────────────────────────────────────
const fetchAll = async () => {
  loadingData.value = true
  try {
    records.value = await $fetch('/api/maintenance', { query: { projectId: props.projectId } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load maintenance records')
  } finally {
    loadingData.value = false
  }
}

onMounted(fetchAll)

// ── Form ────────────────────────────────────────────────────
const saving = ref(false)
const form = reactive({ type: 'truck', cost: '', description: '', date: todayISO })

const saveRecord = async () => {
  saving.value = true
  try {
    await $fetch('/api/maintenance', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        type: form.type,
        cost: Number(form.cost),
        description: form.description || null,
        date: form.date
      }
    })
    form.cost = ''
    form.description = ''
    form.date = todayISO
    await fetchAll()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to record maintenance')
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
        <p class="text-xs text-yellow-600 uppercase font-bold mb-1 tracking-wider">Total Maintenance Cost</p>
        <p class="text-3xl font-bold text-gray-800">Rs. {{ totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</p>
      </div>

      <!-- Cost Breakdown -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-4">Cost by Equipment Type</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div v-for="opt in typeOptions" :key="opt.value" class="text-center p-3 bg-gray-50 rounded-md">
            <p class="text-xs text-gray-500 uppercase font-semibold truncate">{{ opt.label }}</p>
            <p class="text-lg font-bold text-gray-800 mt-1">Rs. {{ costByType[opt.value].toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</p>
          </div>
        </div>
      </div>

      <!-- Maintenance Form -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-6 flex items-center justify-between flex-wrap gap-y-2">
          <span>🔧 Record Maintenance</span>
          <button type="button" @click="showHistory = true" class="text-xs text-yellow-600 hover:underline">View History</button>
        </h4>
        <form v-if="!readonly" @submit.prevent="saveRecord" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Maintenance Type <span class="text-red-500">*</span></label>
              <select v-model="form.type" class="w-full border rounded p-2 text-sm bg-white">
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Maintenance Cost (PKR) <span class="text-red-500">*</span></label>
              <input v-model="form.cost" type="number" step="0.01" min="0" required class="w-full border rounded p-2 text-sm" placeholder="e.g. 5000" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full border rounded p-2 text-sm" placeholder="Optional notes about the maintenance work"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Date <span class="text-red-500">*</span></label>
            <input v-model="form.date" type="date" :max="todayISO" required class="w-full border rounded p-2 text-sm" />
          </div>
          <button type="submit" :disabled="saving" class="w-full bg-yellow-600 text-white font-bold py-2 rounded hover:bg-yellow-700 transition shadow-sm disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Record Maintenance' }}
          </button>
        </form>
      </div>
    </template>

    <!-- Maintenance History Modal -->
    <div v-if="showHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-4">Maintenance History</h3>

        <div v-if="records.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No maintenance records yet.
        </div>

        <div v-else class="space-y-2 overflow-y-auto">
          <div v-for="r in records" :key="r.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ typeLabel(r.type) }}</p>
              <p class="text-xs text-gray-400 truncate">{{ formatDate(r.date) }}<span v-if="r.description"> · {{ r.description }}</span></p>
            </div>
            <span class="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">Rs. {{ Number(r.cost).toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</span>
          </div>
        </div>

        <div class="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button @click="showHistory = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Close</button>
        </div>
      </div>
    </div>

  </div>
</template>
