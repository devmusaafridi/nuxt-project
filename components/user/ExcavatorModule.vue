<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]
const selectedDate = ref(todayISO)
const isToday = computed(() => selectedDate.value === todayISO)

const excavators = ref([])
const sessions = ref([])
const loadingExcavators = ref(true)
const loadingSessions = ref(false)

// ── Summary ──────────────────────────────────────────────
const totalExcavators = computed(() => excavators.value.length)
const workingToday = computed(() => new Set(sessions.value.map(s => s.excavator_id)).size)
const totalHoursToday = computed(() => sessions.value.reduce((sum, s) => sum + sessionHours(s), 0))

// ── Session helpers ────────────────────────────────────────
const sessionsFor = (excavatorId) => sessions.value.filter(s => s.excavator_id === excavatorId)

const sessionHours = (session) => {
  const [sh, sm] = session.start_time.split(':').map(Number)
  const [eh, em] = session.end_time.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff / 60 : 0
}

const totalHoursFor = (excavatorId) => sessionsFor(excavatorId).reduce((sum, s) => sum + sessionHours(s), 0)

const formatTime = (time) => {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// ── Fetch ─────────────────────────────────────────────────
const fetchExcavators = async () => {
  try {
    excavators.value = await $fetch('/api/excavators', { query: { projectId: props.projectId } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load excavators')
  } finally {
    loadingExcavators.value = false
  }
}

const fetchSessions = async () => {
  loadingSessions.value = true
  try {
    sessions.value = await $fetch('/api/excavator-working-hours', { query: { projectId: props.projectId, date: selectedDate.value } })
  } catch (err) {
    console.error('Failed to load excavator working hours:', err)
  } finally {
    loadingSessions.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchExcavators(), fetchSessions()])
})

watch(selectedDate, () => {
  fetchSessions()
})

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

// ── Excavator Entry: Add / Edit modal ─────────────────────
const showExcavatorModal = ref(false)
const excavatorModalMode = ref('add')
const savingExcavator = ref(false)
const excavatorForm = reactive({ id: '', owner_name: '', owner_mobile_number: '', picture_url: '' })
const excavatorPictureFile = ref(null)

const openAddExcavator = () => {
  excavatorModalMode.value = 'add'
  excavatorForm.id = ''
  excavatorForm.owner_name = ''
  excavatorForm.owner_mobile_number = ''
  excavatorForm.picture_url = ''
  excavatorPictureFile.value = null
  showExcavatorModal.value = true
}

const openEditExcavator = (excavator) => {
  excavatorModalMode.value = 'edit'
  excavatorForm.id = excavator.id
  excavatorForm.owner_name = excavator.owner_name
  excavatorForm.owner_mobile_number = excavator.owner_mobile_number || ''
  excavatorForm.picture_url = excavator.picture_url || ''
  excavatorPictureFile.value = null
  showExcavatorModal.value = true
}

const saveExcavator = async () => {
  savingExcavator.value = true
  try {
    let pictureUrl = excavatorForm.picture_url
    if (excavatorPictureFile.value) {
      pictureUrl = await uploadPhoto(excavatorPictureFile.value)
    }

    if (excavatorModalMode.value === 'add') {
      await $fetch('/api/excavators', {
        method: 'POST',
        body: {
          project_id: props.projectId,
          owner_name: excavatorForm.owner_name,
          owner_mobile_number: excavatorForm.owner_mobile_number,
          picture_url: pictureUrl
        }
      })
    } else {
      await $fetch(`/api/excavator/${excavatorForm.id}`, {
        method: 'PATCH',
        body: {
          owner_name: excavatorForm.owner_name,
          owner_mobile_number: excavatorForm.owner_mobile_number,
          picture_url: pictureUrl
        }
      })
    }
    showExcavatorModal.value = false
    await fetchExcavators()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save excavator')
  } finally {
    savingExcavator.value = false
  }
}

const deleteExcavator = async (excavator) => {
  if (!confirm(`Delete excavator owned by "${excavator.owner_name}"? This cannot be undone.`)) return
  try {
    await $fetch(`/api/excavator/${excavator.id}`, { method: 'DELETE' })
    await fetchExcavators()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to delete excavator')
  }
}

// ── Excavator Driver Entry: Assign / Replace modal ────────
const showDriverModal = ref(false)
const savingDriver = ref(false)
const driverExcavator = ref(null)
const driverForm = reactive({ driver_name: '', mobile_number: '' })
const driverPictureFile = ref(null)
const driverCnicFile = ref(null)

const openDriverModal = (excavator) => {
  driverExcavator.value = excavator
  driverForm.driver_name = excavator.driver?.driver_name || ''
  driverForm.mobile_number = excavator.driver?.mobile_number || ''
  driverPictureFile.value = null
  driverCnicFile.value = null
  showDriverModal.value = true
}

const saveDriver = async () => {
  savingDriver.value = true
  try {
    const [picture_url, cnic_picture_url] = await Promise.all([
      driverPictureFile.value ? uploadPhoto(driverPictureFile.value) : (driverExcavator.value.driver?.picture_url || null),
      driverCnicFile.value ? uploadPhoto(driverCnicFile.value) : (driverExcavator.value.driver?.cnic_picture_url || null)
    ])

    await $fetch('/api/excavator-drivers', {
      method: 'POST',
      body: {
        excavator_id: driverExcavator.value.id,
        driver_name: driverForm.driver_name,
        mobile_number: driverForm.mobile_number,
        picture_url,
        cnic_picture_url
      }
    })
    showDriverModal.value = false
    await fetchExcavators()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save driver')
  } finally {
    savingDriver.value = false
  }
}

// ── Driver History modal ──────────────────────────────────
const showHistoryModal = ref(false)
const loadingHistory = ref(false)
const historyExcavator = ref(null)
const driverHistory = ref([])

const formatDateTime = (iso) => {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const openHistoryModal = async (excavator) => {
  historyExcavator.value = excavator
  showHistoryModal.value = true
  loadingHistory.value = true
  driverHistory.value = []
  try {
    driverHistory.value = await $fetch('/api/excavator-drivers', { query: { excavator_id: excavator.id } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load driver history')
  } finally {
    loadingHistory.value = false
  }
}

// ── Working Session: Add modal ────────────────────────────
const showSessionModal = ref(false)
const savingSession = ref(false)
const sessionExcavator = ref(null)
const sessionForm = reactive({ start_time: '', end_time: '' })

const openSessionModal = (excavator) => {
  sessionExcavator.value = excavator
  sessionForm.start_time = ''
  sessionForm.end_time = ''
  showSessionModal.value = true
}

const saveSession = async () => {
  if (sessionForm.end_time <= sessionForm.start_time) {
    alert('End time must be after start time')
    return
  }
  savingSession.value = true
  try {
    await $fetch('/api/excavator-working-hours', {
      method: 'POST',
      body: {
        excavator_id: sessionExcavator.value.id,
        date: selectedDate.value,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time
      }
    })
    showSessionModal.value = false
    await fetchSessions()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save working session')
  } finally {
    savingSession.value = false
  }
}

const deleteSession = async (session) => {
  if (!confirm(`Remove session ${formatTime(session.start_time)} – ${formatTime(session.end_time)}?`)) return
  try {
    await $fetch(`/api/excavator-working-hour/${session.id}`, { method: 'DELETE' })
    await fetchSessions()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to delete session')
  }
}
</script>

<template>
  <div class="space-y-6">

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Excavators</p>
        <p class="text-2xl font-bold text-gray-800">{{ totalExcavators }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">{{ isToday ? 'Total Hours Today' : `Total Hours on ${selectedDate}` }}</p>
        <p class="text-2xl font-bold text-green-600">{{ totalHoursToday.toFixed(1) }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Without Driver</p>
        <p class="text-2xl font-bold text-red-600">{{ excavators.filter(e => !e.driver).length }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingExcavators" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Excavator Working Hours -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4 gap-3">
          <h4 class="font-bold text-gray-700">{{ isToday ? 'Working Hours' : 'Working Hours History' }}</h4>
          <div class="flex items-center gap-2">
            <input
              v-model="selectedDate"
              type="date"
              :max="todayISO"
              class="border rounded p-1.5 text-sm"
            />
            <button
              v-if="!isToday"
              @click="selectedDate = todayISO"
              class="text-xs text-yellow-700 hover:underline whitespace-nowrap"
            >
              Today
            </button>
          </div>
        </div>

        <div v-if="loadingSessions" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
        </div>

        <div v-else-if="excavators.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No excavators added yet.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="excavator in excavators"
            :key="excavator.id"
            class="p-3 bg-gray-50 rounded-md"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="min-w-0 mr-3">
                <p class="text-sm font-bold text-gray-800 truncate">{{ excavator.owner_name }}</p>
                <p class="text-xs text-gray-500">{{ sessionsFor(excavator.id)[0]?.driver_name || excavator.driver?.driver_name || 'No driver' }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-xs font-semibold text-gray-600">{{ totalHoursFor(excavator.id).toFixed(1) }} hrs</span>
                <button
                  v-if="!readonly && isToday"
                  @click="openSessionModal(excavator)"
                  class="text-xs text-yellow-700 hover:underline whitespace-nowrap"
                >
                  + Add Session
                </button>
              </div>
            </div>

            <div v-if="sessionsFor(excavator.id).length === 0" class="text-xs text-gray-400 italic">
              No sessions {{ isToday ? 'logged yet' : 'recorded' }}.
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <span
                v-for="session in sessionsFor(excavator.id)"
                :key="session.id"
                class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border bg-green-100 text-green-700 border-green-200 font-medium"
              >
                {{ formatTime(session.start_time) }} – {{ formatTime(session.end_time) }}
                <button
                  v-if="!readonly && isToday"
                  @click="deleteSession(session)"
                  class="text-green-700 hover:text-red-600 leading-none"
                >
                  &times;
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Excavators List Panel -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-bold text-gray-700">Excavators</h4>
          <button v-if="!readonly" @click="openAddExcavator" class="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded hover:bg-yellow-700 transition">
            + Add Excavator
          </button>
        </div>

        <div v-if="excavators.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No excavators added yet.
        </div>

        <div v-else class="space-y-3">
          <div v-for="excavator in excavators" :key="excavator.id" class="border border-gray-100 rounded-lg p-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3 min-w-0">
                <img
                  v-if="excavator.picture_url"
                  :src="excavator.picture_url"
                  @click="openPreview(excavator.picture_url)"
                  class="w-12 h-12 rounded object-cover flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-80 transition"
                />
                <div v-else class="w-12 h-12 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-lg">🚜</div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-gray-800 truncate">{{ excavator.owner_name }}</p>
                  <p class="text-xs text-gray-500">{{ excavator.owner_mobile_number || '—' }}</p>
                </div>
              </div>
              <div v-if="!readonly" class="flex space-x-3 flex-shrink-0">
                <button @click="openEditExcavator(excavator)" class="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Edit</button>
                <button @click="deleteExcavator(excavator)" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div class="flex items-center space-x-3 min-w-0">
                <img
                  v-if="excavator.driver?.picture_url"
                  :src="excavator.driver.picture_url"
                  @click="openPreview(excavator.driver.picture_url)"
                  class="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-80 transition"
                />
                <div v-else class="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">👤</div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-gray-700 truncate">{{ excavator.driver?.driver_name || 'No driver assigned' }}</p>
                  <p class="text-xs text-gray-400">{{ excavator.driver?.mobile_number || '' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0 ml-2">
                <button
                  @click="openHistoryModal(excavator)"
                  class="text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap"
                >
                  History
                </button>
                <button
                  v-if="!readonly"
                  @click="openDriverModal(excavator)"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  {{ excavator.driver ? 'Replace Driver' : 'Assign Driver' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Excavator Entry: Add / Edit Modal -->
    <div v-if="showExcavatorModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">{{ excavatorModalMode === 'add' ? 'Add Excavator' : 'Edit Excavator' }}</h3>
        <form @submit.prevent="saveExcavator" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Owner Name <span class="text-red-500">*</span></label>
            <input v-model="excavatorForm.owner_name" type="text" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Owner Mobile Number</label>
            <input v-model="excavatorForm.owner_mobile_number" type="text" class="mt-1 block w-full border rounded p-2 text-sm" placeholder="Optional" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Excavator Picture</label>
            <input
              type="file"
              accept="image/*"
              @change="e => excavatorPictureFile = e.target.files[0]"
              class="mt-1 block w-full text-sm"
            />
            <img v-if="excavatorForm.picture_url && !excavatorPictureFile" :src="excavatorForm.picture_url" class="mt-2 w-16 h-16 rounded object-cover border border-gray-200" />
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button @click="showExcavatorModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
            <button type="submit" :disabled="savingExcavator" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm">
              {{ savingExcavator ? 'Saving...' : (excavatorModalMode === 'add' ? 'Add Excavator' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Excavator Driver Entry: Assign / Replace Modal -->
    <div v-if="showDriverModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-1">{{ driverExcavator?.driver ? 'Replace Driver' : 'Assign Driver' }}</h3>
        <p class="text-xs text-gray-500 mb-4">Excavator owner: {{ driverExcavator?.owner_name }}</p>
        <form @submit.prevent="saveDriver" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Driver Name <span class="text-red-500">*</span></label>
            <input v-model="driverForm.driver_name" type="text" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input v-model="driverForm.mobile_number" type="text" class="mt-1 block w-full border rounded p-2 text-sm" placeholder="Optional" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Driver Picture</label>
            <input
              type="file"
              accept="image/*"
              @change="e => driverPictureFile = e.target.files[0]"
              class="mt-1 block w-full text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">CNIC Picture</label>
            <input
              type="file"
              accept="image/*"
              @change="e => driverCnicFile = e.target.files[0]"
              class="mt-1 block w-full text-sm"
            />
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button @click="showDriverModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
            <button type="submit" :disabled="savingDriver" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm">
              {{ savingDriver ? 'Saving...' : (driverExcavator?.driver ? 'Replace Driver' : 'Assign Driver') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Working Session: Add Modal -->
    <div v-if="showSessionModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-1">Add Working Session</h3>
        <p class="text-xs text-gray-500 mb-4">{{ sessionExcavator?.owner_name }} — {{ selectedDate }}</p>
        <form @submit.prevent="saveSession" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Start Time <span class="text-red-500">*</span></label>
              <input v-model="sessionForm.start_time" type="time" required class="mt-1 block w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">End Time <span class="text-red-500">*</span></label>
              <input v-model="sessionForm.end_time" type="time" required class="mt-1 block w-full border rounded p-2 text-sm" />
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button @click="showSessionModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
            <button type="submit" :disabled="savingSession" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm">
              {{ savingSession ? 'Saving...' : 'Add Session' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Driver History Modal -->
    <div v-if="showHistoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-1">Driver History</h3>
        <p class="text-xs text-gray-500 mb-4">Excavator owner: {{ historyExcavator?.owner_name }}</p>

        <div v-if="loadingHistory" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
        </div>

        <div v-else-if="driverHistory.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No drivers have been assigned yet.
        </div>

        <div v-else class="space-y-2 overflow-y-auto">
          <div
            v-for="record in driverHistory"
            :key="record.id"
            class="flex items-center justify-between p-3 rounded-md border"
            :class="record.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'"
          >
            <div class="flex items-center space-x-3 min-w-0">
              <img
                v-if="record.picture_url"
                :src="record.picture_url"
                @click="openPreview(record.picture_url)"
                class="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-80 transition"
              />
              <div v-else class="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">👤</div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ record.driver_name }}</p>
                <p class="text-xs text-gray-400">{{ record.mobile_number || '—' }} · {{ formatDateTime(record.created_at) }}</p>
              </div>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded border font-medium flex-shrink-0 ml-2"
              :class="record.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'"
            >
              {{ record.is_active ? 'Active' : 'Past' }}
            </span>
          </div>
        </div>

        <div class="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button @click="showHistoryModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Close</button>
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
