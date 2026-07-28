<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]

const dieselIn = ref([])
const dieselOut = ref([])
const trucks = ref([])
const excavators = ref([])
const loadingData = ref(true)

// ── Totals ─────────────────────────────────────────────────
const totalIn = computed(() => dieselIn.value.reduce((sum, r) => sum + Number(r.litres), 0))
const totalOut = computed(() => dieselOut.value.reduce((sum, r) => sum + Number(r.litres), 0))
const remaining = computed(() => totalIn.value - totalOut.value)

const consumptionByTarget = computed(() => {
  const totals = { truck: 0, excavator: 0, generator: 0 }
  for (const r of dieselOut.value) {
    totals[r.target_type] = (totals[r.target_type] || 0) + Number(r.litres)
  }
  return totals
})

const targetTypeLabel = (type) => ({ truck: 'Truck', excavator: 'Excavator Machine', generator: 'Generator' }[type] || type)

// ── Fetch ─────────────────────────────────────────────────
const fetchAll = async () => {
  loadingData.value = true
  try {
    const [inRows, outRows, truckRows, excavatorRows] = await Promise.all([
      $fetch('/api/diesel-in', { query: { projectId: props.projectId } }),
      $fetch('/api/diesel-out', { query: { projectId: props.projectId } }),
      $fetch('/api/trucks', { query: { projectId: props.projectId } }),
      $fetch('/api/excavators', { query: { projectId: props.projectId } })
    ])
    dieselIn.value = inRows
    dieselOut.value = outRows
    trucks.value = truckRows
    excavators.value = excavatorRows
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load diesel data')
  } finally {
    loadingData.value = false
  }
}

onMounted(fetchAll)

// ── Photo preview (lightbox) ───────────────────────────────
const previewUrl = ref(null)
const openPreview = (url) => {
  if (url) previewUrl.value = url
}

// ── Photo upload ──────────────────────────────────────────
const uploadPhoto = async (file) => {
  if (!file) return null
  const formData = new FormData()
  formData.append('file', file)
  const { url } = await $fetch('/api/upload-photo', { method: 'POST', body: formData })
  return url
}

// ── Diesel In form ─────────────────────────────────────────
const savingDieselIn = ref(false)
const dieselInForm = reactive({ litres: '', price_per_litre: '', date: todayISO })
const dieselInSlipFile = ref(null)

const saveDieselIn = async () => {
  savingDieselIn.value = true
  try {
    const slip_image_url = dieselInSlipFile.value ? await uploadPhoto(dieselInSlipFile.value) : null
    await $fetch('/api/diesel-in', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        litres: Number(dieselInForm.litres),
        price_per_litre: Number(dieselInForm.price_per_litre),
        date: dieselInForm.date,
        slip_image_url
      }
    })
    dieselInForm.litres = ''
    dieselInForm.price_per_litre = ''
    dieselInForm.date = todayISO
    dieselInSlipFile.value = null
    await fetchAll()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to record diesel in')
  } finally {
    savingDieselIn.value = false
  }
}

// ── Diesel Out form ────────────────────────────────────────
const savingDieselOut = ref(false)
const dieselOutForm = reactive({ target_type: 'truck', target_id: '', litres: '', date: todayISO })

const targetOptions = computed(() => {
  if (dieselOutForm.target_type === 'truck') return trucks.value.map(t => ({ id: t.id, label: t.owner_name }))
  if (dieselOutForm.target_type === 'excavator') return excavators.value.map(e => ({ id: e.id, label: e.owner_name }))
  return []
})

watch(() => dieselOutForm.target_type, () => {
  dieselOutForm.target_id = ''
})

const saveDieselOut = async () => {
  savingDieselOut.value = true
  try {
    await $fetch('/api/diesel-out', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        target_type: dieselOutForm.target_type,
        target_id: dieselOutForm.target_type === 'generator' ? null : dieselOutForm.target_id,
        litres: Number(dieselOutForm.litres),
        date: dieselOutForm.date
      }
    })
    dieselOutForm.target_id = ''
    dieselOutForm.litres = ''
    dieselOutForm.date = todayISO
    await fetchAll()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to record diesel consumption')
  } finally {
    savingDieselOut.value = false
  }
}

// ── History modals ─────────────────────────────────────────
const showInHistory = ref(false)
const showOutHistory = ref(false)

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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-100 shadow-sm">
          <p class="text-xs text-yellow-600 uppercase font-bold mb-1 tracking-wider">Total Diesel In</p>
          <p class="text-3xl font-bold text-gray-800">{{ totalIn.toFixed(1) }} <span class="text-lg font-normal">Litres</span></p>
        </div>
        <div class="bg-red-50 p-6 rounded-lg border border-red-100 shadow-sm">
          <p class="text-xs text-red-600 uppercase font-bold mb-1 tracking-wider">Total Diesel Out</p>
          <p class="text-3xl font-bold text-gray-800">{{ totalOut.toFixed(1) }} <span class="text-lg font-normal">Litres</span></p>
        </div>
        <div class="bg-green-50 p-6 rounded-lg border border-green-100 shadow-sm border-b-4 border-b-green-500">
          <p class="text-xs text-green-600 uppercase font-bold mb-1 tracking-wider">Remaining Diesel</p>
          <p class="text-3xl font-bold text-gray-800">{{ remaining.toFixed(1) }} <span class="text-lg font-normal">Litres</span></p>
        </div>
      </div>

      <!-- Consumption Breakdown -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-4">Consumption by Source</h4>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="key in ['truck', 'excavator', 'generator']" :key="key" class="text-center p-3 bg-gray-50 rounded-md">
            <p class="text-xs text-gray-500 uppercase font-semibold">{{ targetTypeLabel(key) }}</p>
            <p class="text-lg font-bold text-gray-800 mt-1">{{ consumptionByTarget[key].toFixed(1) }} L</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Diesel In Form -->
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 class="font-bold text-gray-700 mb-6 flex items-center justify-between flex-wrap gap-y-2">
            <span>⛽ Record Diesel In</span>
            <button type="button" @click="showInHistory = true" class="text-xs text-yellow-600 hover:underline">View History</button>
          </h4>
          <form v-if="!readonly" @submit.prevent="saveDieselIn" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Litres <span class="text-red-500">*</span></label>
                <input v-model="dieselInForm.litres" type="number" step="0.01" min="0" required class="w-full border rounded p-2 text-sm" placeholder="e.g. 500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Price per Litre <span class="text-red-500">*</span></label>
                <input v-model="dieselInForm.price_per_litre" type="number" step="0.01" min="0" required class="w-full border rounded p-2 text-sm" placeholder="PKR" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Date <span class="text-red-500">*</span></label>
              <input v-model="dieselInForm.date" type="date" :max="todayISO" required class="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Diesel Slip Image</label>
              <input
                type="file"
                accept="image/*"
                @change="e => dieselInSlipFile = e.target.files[0]"
                class="w-full text-sm"
              />
            </div>
            <button type="submit" :disabled="savingDieselIn" class="w-full bg-yellow-600 text-white font-bold py-2 rounded hover:bg-yellow-700 transition shadow-sm disabled:opacity-50">
              {{ savingDieselIn ? 'Saving...' : 'Record Diesel In' }}
            </button>
          </form>
        </div>

        <!-- Diesel Out Form -->
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 class="font-bold text-gray-700 mb-6 flex items-center justify-between flex-wrap gap-y-2">
            <span>🚜 Diesel Consumption (Out)</span>
            <button type="button" @click="showOutHistory = true" class="text-xs text-red-600 hover:underline">View History</button>
          </h4>
          <form v-if="!readonly" @submit.prevent="saveDieselOut" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Consumption Source</label>
              <select v-model="dieselOutForm.target_type" class="w-full border rounded p-2 text-sm bg-white">
                <option value="truck">Truck</option>
                <option value="excavator">Excavator Machine</option>
                <option value="generator">Generator</option>
              </select>
            </div>
            <div v-if="dieselOutForm.target_type !== 'generator'">
              <label class="block text-xs font-medium text-gray-500 mb-1">
                {{ dieselOutForm.target_type === 'truck' ? 'Truck' : 'Excavator' }} <span class="text-red-500">*</span>
              </label>
              <select v-model="dieselOutForm.target_id" required class="w-full border rounded p-2 text-sm bg-white">
                <option value="" disabled>Select {{ dieselOutForm.target_type === 'truck' ? 'a truck' : 'an excavator' }}</option>
                <option v-for="opt in targetOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
              </select>
              <p v-if="targetOptions.length === 0" class="text-xs text-gray-400 italic mt-1">
                No {{ dieselOutForm.target_type === 'truck' ? 'trucks' : 'excavators' }} added yet.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Litres Consumed <span class="text-red-500">*</span></label>
                <input v-model="dieselOutForm.litres" type="number" step="0.01" min="0" required class="w-full border rounded p-2 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Date <span class="text-red-500">*</span></label>
                <input v-model="dieselOutForm.date" type="date" :max="todayISO" required class="w-full border rounded p-2 text-sm" />
              </div>
            </div>
            <button type="submit" :disabled="savingDieselOut" class="w-full bg-gray-800 text-white font-bold py-2 rounded hover:bg-gray-900 transition shadow-sm disabled:opacity-50">
              {{ savingDieselOut ? 'Saving...' : 'Record Consumption' }}
            </button>
          </form>
        </div>
      </div>
    </template>

    <!-- Diesel In History Modal -->
    <div v-if="showInHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-4">Diesel In History</h3>

        <div v-if="dieselIn.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No diesel in records yet.
        </div>

        <div v-else class="space-y-2 overflow-y-auto">
          <div v-for="r in dieselIn" :key="r.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
            <div class="flex items-center space-x-3 min-w-0">
              <img
                v-if="r.slip_image_url"
                :src="r.slip_image_url"
                @click="openPreview(r.slip_image_url)"
                class="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-80 transition"
              />
              <div v-else class="w-10 h-10 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">⛽</div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-800">{{ Number(r.litres).toFixed(1) }} L @ Rs. {{ Number(r.price_per_litre).toFixed(2) }}/L</p>
                <p class="text-xs text-gray-400">{{ formatDate(r.date) }} · Rs. {{ (Number(r.litres) * Number(r.price_per_litre)).toLocaleString(undefined, { maximumFractionDigits: 0 }) }} total</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button @click="showInHistory = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Close</button>
        </div>
      </div>
    </div>

    <!-- Diesel Out History Modal -->
    <div v-if="showOutHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-4">Diesel Consumption History</h3>

        <div v-if="dieselOut.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No diesel consumption records yet.
        </div>

        <div v-else class="space-y-2 overflow-y-auto">
          <div v-for="r in dieselOut" :key="r.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ r.target_name }}</p>
              <p class="text-xs text-gray-400">{{ targetTypeLabel(r.target_type) }} · {{ formatDate(r.date) }}</p>
            </div>
            <span class="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">{{ Number(r.litres).toFixed(1) }} L</span>
          </div>
        </div>

        <div class="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button @click="showOutHistory = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Close</button>
        </div>
      </div>
    </div>

    <!-- Photo Preview Lightbox -->
    <div
      v-if="previewUrl"
      @click="previewUrl = null"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60] cursor-zoom-out"
    >
      <img :src="previewUrl" class="max-w-full max-h-full rounded-lg shadow-2xl" />
      <button
        @click.stop="previewUrl = null"
        class="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
      >
        &times;
      </button>
    </div>

  </div>
</template>
