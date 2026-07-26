<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]

const workers = ref([])
const attendance = ref([])
const loadingWorkers = ref(true)
const savingAttendance = ref({}) // { [workerId]: 'day'|'night'|'leave'|null }

// ── Summary ──────────────────────────────────────────────
const totalWorkers = computed(() => workers.value.length)
const activeWorkers = computed(() => workers.value.filter(w => w.status === 'active'))
const presentToday = computed(() => attendance.value.filter(a => a.status === 'day' || a.status === 'night'))
const dailyCost = computed(() => {
  const presentIds = new Set(presentToday.value.map(a => a.worker_id))
  return workers.value
    .filter(w => presentIds.has(w.id))
    .reduce((sum, w) => sum + Number(w.daily_salary), 0)
})

// ── Attendance helpers ────────────────────────────────────
const getAttendance = (workerId) => attendance.value.find(a => a.worker_id === workerId)

const attendanceBadge = (status) => {
  if (status === 'day') return 'bg-green-100 text-green-700 border-green-200'
  if (status === 'night') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (status === 'leave') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-gray-100 text-gray-500 border-gray-200'
}

const attendanceLabel = (status) => {
  if (status === 'day') return 'Day'
  if (status === 'night') return 'Night'
  if (status === 'leave') return 'Leave'
  return 'Not Marked'
}

// ── Fetch ─────────────────────────────────────────────────
const fetchWorkers = async () => {
  try {
    workers.value = await $fetch('/api/workers', { query: { projectId: props.projectId } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load workers')
  } finally {
    loadingWorkers.value = false
  }
}

const fetchAttendance = async () => {
  try {
    attendance.value = await $fetch('/api/attendance', { query: { projectId: props.projectId, date: todayISO } })
  } catch (err) {
    console.error('Failed to load attendance:', err)
  }
}

onMounted(async () => {
  await Promise.all([fetchWorkers(), fetchAttendance()])
})

// ── Mark attendance ───────────────────────────────────────
const markAttendance = async (worker, status) => {
  savingAttendance.value[worker.id] = status
  try {
    await $fetch('/api/attendance', {
      method: 'POST',
      body: { worker_id: worker.id, project_id: props.projectId, date: todayISO, status }
    })
    await fetchAttendance()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save attendance')
  } finally {
    savingAttendance.value[worker.id] = null
  }
}

// ── Add / Edit modal ──────────────────────────────────────
const showModal = ref(false)
const modalMode = ref('add')
const saving = ref(false)
const form = reactive({ id: '', name: '', mobile_number: '', daily_salary: '', status: 'active' })

const openAdd = () => {
  modalMode.value = 'add'
  form.id = ''
  form.name = ''
  form.mobile_number = ''
  form.daily_salary = ''
  form.status = 'active'
  showModal.value = true
}

const openEdit = (worker) => {
  modalMode.value = 'edit'
  form.id = worker.id
  form.name = worker.name
  form.mobile_number = worker.mobile_number || ''
  form.daily_salary = worker.daily_salary
  form.status = worker.status
  showModal.value = true
}

const saveWorker = async () => {
  saving.value = true
  try {
    if (modalMode.value === 'add') {
      await $fetch('/api/workers', {
        method: 'POST',
        body: {
          project_id: props.projectId,
          name: form.name,
          mobile_number: form.mobile_number,
          daily_salary: form.daily_salary,
          status: form.status
        }
      })
    } else {
      await $fetch(`/api/worker/${form.id}`, {
        method: 'PATCH',
        body: {
          name: form.name,
          mobile_number: form.mobile_number,
          daily_salary: form.daily_salary,
          status: form.status
        }
      })
    }
    showModal.value = false
    await fetchWorkers()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save worker')
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────
const deleteWorker = async (worker) => {
  if (!confirm(`Delete worker "${worker.name}"? This cannot be undone.`)) return
  try {
    await $fetch(`/api/worker/${worker.id}`, { method: 'DELETE' })
    await fetchWorkers()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to delete worker')
  }
}
</script>

<template>
  <div class="space-y-6">

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Workers</p>
        <p class="text-2xl font-bold text-gray-800">{{ totalWorkers }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Active</p>
        <p class="text-2xl font-bold text-green-600">{{ activeWorkers.length }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Present Today</p>
        <p class="text-2xl font-bold text-blue-600">{{ presentToday.length }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Daily Cost</p>
        <p class="text-2xl font-bold text-yellow-600">Rs. {{ dailyCost.toLocaleString() }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingWorkers" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Attendance Panel -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 class="font-bold text-gray-700 mb-4">Daily Attendance — {{ todayISO }}</h4>

        <div v-if="activeWorkers.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No active workers. Add workers first.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="worker in activeWorkers"
            :key="worker.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
          >
            <div class="min-w-0 mr-3">
              <p class="text-sm font-bold text-gray-800 truncate">{{ worker.name }}</p>
              <div class="flex items-center mt-1 space-x-2">
                <p class="text-xs text-gray-500">Rs. {{ Number(worker.daily_salary).toLocaleString() }}/day</p>
                <span
                  v-if="getAttendance(worker.id)"
                  :class="['text-xs px-2 py-0.5 rounded border font-medium', attendanceBadge(getAttendance(worker.id)?.status)]"
                >
                  {{ attendanceLabel(getAttendance(worker.id)?.status) }}
                </span>
              </div>
            </div>
            <div class="flex space-x-1 flex-shrink-0">
              <!-- Read-only badge -->
              <span
                v-if="readonly"
                :class="['text-xs px-2 py-1 rounded border font-medium', attendanceBadge(getAttendance(worker.id)?.status)]"
              >
                {{ attendanceLabel(getAttendance(worker.id)?.status) }}
              </span>
              <!-- Editable buttons -->
              <template v-else>
                <button
                  v-for="s in ['day', 'night', 'leave']"
                  :key="s"
                  @click="markAttendance(worker, s)"
                  :disabled="savingAttendance[worker.id] === s"
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded border transition',
                    s === 'day' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                    s === 'night' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' :
                    'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
                    getAttendance(worker.id)?.status === s ? 'ring-2 ring-offset-1 ' + (s === 'day' ? 'ring-green-400' : s === 'night' ? 'ring-blue-400' : 'ring-red-400') : '',
                    savingAttendance[worker.id] === s ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  {{ savingAttendance[worker.id] === s ? '...' : s.charAt(0).toUpperCase() + s.slice(1) }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Workers List Panel -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-bold text-gray-700">Workers</h4>
          <button v-if="!readonly" @click="openAdd" class="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded hover:bg-yellow-700 transition">
            + Add Worker
          </button>
        </div>

        <div v-if="workers.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No workers added yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Name</th>
                <th class="px-3 py-2 text-left font-semibold">Mobile</th>
                <th class="px-3 py-2 text-right font-semibold">Rs./day</th>
                <th class="px-3 py-2 text-center font-semibold">Status</th>
                <th class="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="worker in workers" :key="worker.id" class="hover:bg-gray-50">
                <td class="px-3 py-3 font-medium text-gray-800">{{ worker.name }}</td>
                <td class="px-3 py-3 text-gray-500">{{ worker.mobile_number || '—' }}</td>
                <td class="px-3 py-3 text-right text-gray-700">{{ Number(worker.daily_salary).toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span
                    :class="worker.status === 'active'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'"
                    class="text-xs px-2 py-0.5 rounded border font-medium capitalize"
                  >
                    {{ worker.status }}
                  </span>
                </td>
                <td v-if="!readonly" class="px-3 py-3 text-right space-x-3">
                  <button @click="openEdit(worker)" class="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Edit</button>
                  <button @click="deleteWorker(worker)" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div v-if="showModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">{{ modalMode === 'add' ? 'Add Worker' : 'Edit Worker' }}</h3>
        <form @submit.prevent="saveWorker" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input v-model="form.mobile_number" type="text" class="mt-1 block w-full border rounded p-2 text-sm" placeholder="Optional" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Daily Salary (Rs.) <span class="text-red-500">*</span></label>
            <input v-model="form.daily_salary" type="number" min="0" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select v-model="form.status" class="mt-1 block w-full border rounded p-2 text-sm bg-white">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button @click="showModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
            <button type="submit" :disabled="saving" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm">
              {{ saving ? 'Saving...' : (modalMode === 'add' ? 'Add Worker' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
