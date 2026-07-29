<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]

const records = ref([])
const loadingData = ref(true)

const typeOptions = [
  { value: 'food', label: 'Food' },
  { value: 'police', label: 'Police' },
  { value: 'transport', label: 'Transport' },
  { value: 'miscellaneous', label: 'Others' }
]

const typeLabel = (type) => typeOptions.find(t => t.value === type)?.label || type

// ── Totals ─────────────────────────────────────────────────
const totalAmount = computed(() => records.value.reduce((sum, r) => sum + Number(r.amount), 0))

const amountByType = computed(() => {
  const totals = { food: 0, police: 0, transport: 0, miscellaneous: 0 }
  for (const r of records.value) {
    totals[r.type] = (totals[r.type] || 0) + Number(r.amount)
  }
  return totals
})

// ── Fetch ─────────────────────────────────────────────────
const fetchAll = async () => {
  loadingData.value = true
  try {
    records.value = await $fetch('/api/other-expenses', { query: { projectId: props.projectId } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load expense records')
  } finally {
    loadingData.value = false
  }
}

onMounted(fetchAll)

// ── Form ────────────────────────────────────────────────────
const saving = ref(false)
const form = reactive({ type: 'food', amount: '', description: '', date: todayISO })

const saveRecord = async () => {
  saving.value = true
  try {
    await $fetch('/api/other-expenses', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        type: form.type,
        amount: Number(form.amount),
        description: form.description || null,
        date: form.date
      }
    })
    form.amount = ''
    form.description = ''
    form.date = todayISO
    await fetchAll()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to record expense')
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
        <p class="text-xs text-yellow-600 uppercase font-bold mb-1 tracking-wider">Total Other Expenses</p>
        <p class="text-3xl font-bold text-gray-800">Rs. {{ totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</p>
      </div>

      <!-- Amount Breakdown -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-4">Amount by Expense Type</h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div v-for="opt in typeOptions" :key="opt.value" class="text-center p-3 bg-gray-50 rounded-md">
            <p class="text-xs text-gray-500 uppercase font-semibold truncate">{{ opt.label }}</p>
            <p class="text-lg font-bold text-gray-800 mt-1">Rs. {{ amountByType[opt.value].toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</p>
          </div>
        </div>
      </div>

      <!-- Expense Form -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-6 flex items-center justify-between flex-wrap gap-y-2">
          <span>💵 Record Expense</span>
          <button type="button" @click="showHistory = true" class="text-xs text-yellow-600 hover:underline">View History</button>
        </h4>
        <form v-if="!readonly" @submit.prevent="saveRecord" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Expense Type <span class="text-red-500">*</span></label>
              <select v-model="form.type" class="w-full border rounded p-2 text-sm bg-white">
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Amount (PKR) <span class="text-red-500">*</span></label>
              <input v-model="form.amount" type="number" step="0.01" min="0" required class="w-full border rounded p-2 text-sm" placeholder="e.g. 1000" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full border rounded p-2 text-sm" placeholder="Optional notes about this expense"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Date <span class="text-red-500">*</span></label>
            <input v-model="form.date" type="date" :max="todayISO" required class="w-full border rounded p-2 text-sm" />
          </div>
          <button type="submit" :disabled="saving" class="w-full bg-yellow-600 text-white font-bold py-2 rounded hover:bg-yellow-700 transition shadow-sm disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Record Expense' }}
          </button>
        </form>
      </div>
    </template>

    <!-- Expense History Modal -->
    <div v-if="showHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-4">Expense History</h3>

        <div v-if="records.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No expense records yet.
        </div>

        <div v-else class="space-y-2 overflow-y-auto">
          <div v-for="r in records" :key="r.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ typeLabel(r.type) }}</p>
              <p class="text-xs text-gray-400 truncate">{{ formatDate(r.date) }}<span v-if="r.description"> · {{ r.description }}</span></p>
            </div>
            <span class="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">Rs. {{ Number(r.amount).toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</span>
          </div>
        </div>

        <div class="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button @click="showHistory = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Close</button>
        </div>
      </div>
    </div>

  </div>
</template>
