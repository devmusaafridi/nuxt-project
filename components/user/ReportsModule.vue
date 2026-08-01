<script setup>
const props = defineProps({
  projectId: { type: String, required: true }
})

const todayISO = new Date().toISOString().split('T')[0]
const loading = ref(true)

const workers = ref([])
const workerAttendance = ref([])
const workerPayments = ref([])

const trucks = ref([])
const truckAttendance = ref([])
const truckPayments = ref([])

const excavators = ref([])
const excavatorSessions = ref([])
const excavatorPayments = ref([])

const plants = ref([])
const plantSessions = ref([])
const plantPayments = ref([])

// ── Shared helpers ──────────────────────────────────────────
const sessionHours = (session) => {
  const [sh, sm] = session.start_time.split(':').map(Number)
  const [eh, em] = session.end_time.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff / 60 : 0
}

const monthsElapsed = (createdAt) => {
  const start = new Date(createdAt)
  const now = new Date()
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
  return Math.max(1, months)
}

const paidFor = (payments, targetId) => payments.filter(p => p.target_id === targetId).reduce((sum, p) => sum + Number(p.amount), 0)

// ── Report rows ─────────────────────────────────────────────
const workerRows = computed(() => workers.value.map(w => {
  const days = workerAttendance.value.filter(a => a.worker_id === w.id && (a.status === 'day' || a.status === 'night')).length
  const dailySalary = Number(w.daily_salary || 0)
  const totalSalary = days * dailySalary
  const paid = paidFor(workerPayments.value, w.id)
  return { id: w.id, name: w.name, days, dailySalary, totalSalary, paid, pending: totalSalary - paid }
}))

const truckRows = computed(() => trucks.value.map(t => {
  const days = truckAttendance.value.filter(a => a.truck_id === t.id && a.present).length
  const months = monthsElapsed(t.created_at)
  const monthlySalary = Number(t.monthly_salary || 0)
  const paymentCalc = months * monthlySalary
  const paid = paidFor(truckPayments.value, t.id)
  return { id: t.id, name: t.owner_name, days, months, monthlySalary, paymentCalc, paid, pending: paymentCalc - paid }
}))

const excavatorRows = computed(() => excavators.value.map(e => {
  const hours = excavatorSessions.value.filter(s => s.excavator_id === e.id).reduce((sum, s) => sum + sessionHours(s), 0)
  const hourlyRate = Number(e.hourly_rate || 0)
  const totalPayment = hours * hourlyRate
  const paid = paidFor(excavatorPayments.value, e.id)
  return { id: e.id, name: e.owner_name, hours, hourlyRate, totalPayment, paid, pending: totalPayment - paid }
}))

const plantRows = computed(() => plants.value.map(pl => {
  const hours = plantSessions.value.filter(s => s.plant_id === pl.id).reduce((sum, s) => sum + sessionHours(s), 0)
  const hourlyRate = Number(pl.hourly_rate || 0)
  const totalPayment = hours * hourlyRate
  const paid = paidFor(plantPayments.value, pl.id)
  return { id: pl.id, name: pl.name, hours, hourlyRate, totalPayment, paid, pending: totalPayment - paid }
}))

// ── Fetch ─────────────────────────────────────────────────
const fetchAll = async () => {
  loading.value = true
  try {
    const query = { projectId: props.projectId }
    const [
      workersData, attendanceData, workerPaymentsData,
      trucksData, truckAttendanceData, truckPaymentsData,
      excavatorsData, excavatorSessionsData, excavatorPaymentsData,
      plantsData, plantSessionsData, plantPaymentsData
    ] = await Promise.all([
      $fetch('/api/workers', { query }),
      $fetch('/api/attendance', { query }),
      $fetch('/api/payments', { query: { ...query, targetType: 'worker' } }),
      $fetch('/api/trucks', { query }),
      $fetch('/api/truck-attendance', { query }),
      $fetch('/api/payments', { query: { ...query, targetType: 'truck' } }),
      $fetch('/api/excavators', { query }),
      $fetch('/api/excavator-working-hours', { query }),
      $fetch('/api/payments', { query: { ...query, targetType: 'excavator' } }),
      $fetch('/api/plants', { query }),
      $fetch('/api/plant-working-hours', { query }),
      $fetch('/api/payments', { query: { ...query, targetType: 'plant' } })
    ])

    workers.value = workersData
    workerAttendance.value = attendanceData
    workerPayments.value = workerPaymentsData
    trucks.value = trucksData
    truckAttendance.value = truckAttendanceData
    truckPayments.value = truckPaymentsData
    excavators.value = excavatorsData
    excavatorSessions.value = excavatorSessionsData
    excavatorPayments.value = excavatorPaymentsData
    plants.value = plantsData
    plantSessions.value = plantSessionsData
    plantPayments.value = plantPaymentsData
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load report data')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

const refetchPayments = async (type) => {
  const data = await $fetch('/api/payments', { query: { projectId: props.projectId, targetType: type } })
  if (type === 'worker') workerPayments.value = data
  else if (type === 'truck') truckPayments.value = data
  else if (type === 'excavator') excavatorPayments.value = data
  else if (type === 'plant') plantPayments.value = data
}

// ── Record Payment modal (shared across all 4 report sections) ─────
const showPaymentModal = ref(false)
const savingPayment = ref(false)
const paymentTarget = ref(null)
const paymentForm = reactive({ amount: '', date: todayISO })

const openPaymentModal = (type, id, name) => {
  paymentTarget.value = { type, id, name }
  paymentForm.amount = ''
  paymentForm.date = todayISO
  showPaymentModal.value = true
}

const savePayment = async () => {
  savingPayment.value = true
  try {
    await $fetch('/api/payments', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        target_type: paymentTarget.value.type,
        target_id: paymentTarget.value.id,
        amount: Number(paymentForm.amount),
        date: paymentForm.date
      }
    })
    showPaymentModal.value = false
    await refetchPayments(paymentTarget.value.type)
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to record payment')
  } finally {
    savingPayment.value = false
  }
}

const money = (n) => `Rs. ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
</script>

<template>
  <div class="space-y-6">

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
    </div>

    <template v-else>

      <!-- Worker Report -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 class="font-bold text-gray-700 mb-4">Worker Report</h4>
        <div v-if="workerRows.length === 0" class="text-center py-8 text-gray-400 text-sm italic">No workers added yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Name</th>
                <th class="px-3 py-2 text-right font-semibold">Working Days</th>
                <th class="px-3 py-2 text-right font-semibold">Daily Salary</th>
                <th class="px-3 py-2 text-right font-semibold">Total Salary</th>
                <th class="px-3 py-2 text-right font-semibold">Salary Paid</th>
                <th class="px-3 py-2 text-right font-semibold">Salary Pending</th>
                <th class="px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in workerRows" :key="row.id" class="hover:bg-gray-50">
                <td class="px-3 py-3 font-medium text-gray-800">{{ row.name }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ row.days }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ money(row.dailySalary) }}</td>
                <td class="px-3 py-3 text-right font-semibold text-gray-800">{{ money(row.totalSalary) }}</td>
                <td class="px-3 py-3 text-right text-green-600">{{ money(row.paid) }}</td>
                <td class="px-3 py-3 text-right" :class="row.pending > 0 ? 'text-red-600' : 'text-gray-500'">{{ money(row.pending) }}</td>
                <td class="px-3 py-3 text-right">
                  <button @click="openPaymentModal('worker', row.id, row.name)" class="text-xs text-yellow-600 hover:text-yellow-800 font-medium whitespace-nowrap">Record Payment</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Truck Report -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 class="font-bold text-gray-700 mb-4">Truck Report</h4>
        <div v-if="truckRows.length === 0" class="text-center py-8 text-gray-400 text-sm italic">No trucks added yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Owner</th>
                <th class="px-3 py-2 text-right font-semibold">Working Days</th>
                <th class="px-3 py-2 text-right font-semibold">Payment Calculation</th>
                <th class="px-3 py-2 text-right font-semibold">Paid Amount</th>
                <th class="px-3 py-2 text-right font-semibold">Pending Amount</th>
                <th class="px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in truckRows" :key="row.id" class="hover:bg-gray-50">
                <td class="px-3 py-3 font-medium text-gray-800">{{ row.name }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ row.days }}</td>
                <td class="px-3 py-3 text-right font-semibold text-gray-800">
                  {{ money(row.paymentCalc) }}
                  <span class="text-xs text-gray-400 font-normal">({{ row.months }} mo × {{ money(row.monthlySalary) }})</span>
                </td>
                <td class="px-3 py-3 text-right text-green-600">{{ money(row.paid) }}</td>
                <td class="px-3 py-3 text-right" :class="row.pending > 0 ? 'text-red-600' : 'text-gray-500'">{{ money(row.pending) }}</td>
                <td class="px-3 py-3 text-right">
                  <button @click="openPaymentModal('truck', row.id, row.name)" class="text-xs text-yellow-600 hover:text-yellow-800 font-medium whitespace-nowrap">Record Payment</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Excavator Report -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 class="font-bold text-gray-700 mb-4">Excavator Report</h4>
        <div v-if="excavatorRows.length === 0" class="text-center py-8 text-gray-400 text-sm italic">No excavators added yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Owner</th>
                <th class="px-3 py-2 text-right font-semibold">Working Hours</th>
                <th class="px-3 py-2 text-right font-semibold">Hourly Charges</th>
                <th class="px-3 py-2 text-right font-semibold">Total Payment</th>
                <th class="px-3 py-2 text-right font-semibold">Paid Amount</th>
                <th class="px-3 py-2 text-right font-semibold">Pending Amount</th>
                <th class="px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in excavatorRows" :key="row.id" class="hover:bg-gray-50">
                <td class="px-3 py-3 font-medium text-gray-800">{{ row.name }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ row.hours.toFixed(1) }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ money(row.hourlyRate) }}</td>
                <td class="px-3 py-3 text-right font-semibold text-gray-800">{{ money(row.totalPayment) }}</td>
                <td class="px-3 py-3 text-right text-green-600">{{ money(row.paid) }}</td>
                <td class="px-3 py-3 text-right" :class="row.pending > 0 ? 'text-red-600' : 'text-gray-500'">{{ money(row.pending) }}</td>
                <td class="px-3 py-3 text-right">
                  <button @click="openPaymentModal('excavator', row.id, row.name)" class="text-xs text-yellow-600 hover:text-yellow-800 font-medium whitespace-nowrap">Record Payment</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Plant Report -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 class="font-bold text-gray-700 mb-4">Plant Report</h4>
        <div v-if="plantRows.length === 0" class="text-center py-8 text-gray-400 text-sm italic">No plants added yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Name</th>
                <th class="px-3 py-2 text-right font-semibold">Working Hours</th>
                <th class="px-3 py-2 text-right font-semibold">Hourly Charges</th>
                <th class="px-3 py-2 text-right font-semibold">Total Payment</th>
                <th class="px-3 py-2 text-right font-semibold">Paid Amount</th>
                <th class="px-3 py-2 text-right font-semibold">Pending Amount</th>
                <th class="px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in plantRows" :key="row.id" class="hover:bg-gray-50">
                <td class="px-3 py-3 font-medium text-gray-800">{{ row.name }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ row.hours.toFixed(1) }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ money(row.hourlyRate) }}</td>
                <td class="px-3 py-3 text-right font-semibold text-gray-800">{{ money(row.totalPayment) }}</td>
                <td class="px-3 py-3 text-right text-green-600">{{ money(row.paid) }}</td>
                <td class="px-3 py-3 text-right" :class="row.pending > 0 ? 'text-red-600' : 'text-gray-500'">{{ money(row.pending) }}</td>
                <td class="px-3 py-3 text-right">
                  <button @click="openPaymentModal('plant', row.id, row.name)" class="text-xs text-yellow-600 hover:text-yellow-800 font-medium whitespace-nowrap">Record Payment</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>

    <!-- Record Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold mb-1">Record Payment</h3>
        <p class="text-xs text-gray-500 mb-4">{{ paymentTarget?.name }}</p>
        <form @submit.prevent="savePayment" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Amount (Rs.) <span class="text-red-500">*</span></label>
            <input v-model="paymentForm.amount" type="number" step="0.01" min="0" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Date <span class="text-red-500">*</span></label>
            <input v-model="paymentForm.date" type="date" :max="todayISO" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button @click="showPaymentModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
            <button type="submit" :disabled="savingPayment" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm">
              {{ savingPayment ? 'Saving...' : 'Record Payment' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
