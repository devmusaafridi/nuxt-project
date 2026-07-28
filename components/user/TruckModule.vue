<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]
const selectedDate = ref(todayISO)
const isToday = computed(() => selectedDate.value === todayISO)

const trucks = ref([])
const attendance = ref([])
const loadingTrucks = ref(true)
const loadingAttendance = ref(false)
const savingAttendance = ref({}) // { [truckId]: 'yes'|'no'|null }

// ── Summary ──────────────────────────────────────────────
const totalTrucks = computed(() => trucks.value.length)
const presentToday = computed(() => attendance.value.filter(a => a.present))

// ── Attendance helpers ────────────────────────────────────
const getAttendance = (truckId) => attendance.value.find(a => a.truck_id === truckId)

const attendanceBadge = (record) => {
  if (!record) return 'bg-gray-100 text-gray-500 border-gray-200'
  return record.present ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
}

const attendanceLabel = (record) => {
  if (!record) return 'Not Marked'
  return record.present ? 'Yes' : 'No'
}

// ── Fetch ─────────────────────────────────────────────────
const fetchTrucks = async () => {
  try {
    trucks.value = await $fetch('/api/trucks', { query: { projectId: props.projectId } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load trucks')
  } finally {
    loadingTrucks.value = false
  }
}

const fetchAttendance = async () => {
  loadingAttendance.value = true
  try {
    attendance.value = await $fetch('/api/truck-attendance', { query: { projectId: props.projectId, date: selectedDate.value } })
  } catch (err) {
    console.error('Failed to load truck attendance:', err)
  } finally {
    loadingAttendance.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchTrucks(), fetchAttendance()])
})

watch(selectedDate, () => {
  fetchAttendance()
})

// ── Mark attendance ───────────────────────────────────────
const markAttendance = async (truck, present) => {
  const key = present ? 'yes' : 'no'
  savingAttendance.value[truck.id] = key
  try {
    await $fetch('/api/truck-attendance', {
      method: 'POST',
      body: { truck_id: truck.id, date: selectedDate.value, present }
    })
    await fetchAttendance()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save attendance')
  } finally {
    savingAttendance.value[truck.id] = null
  }
}

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

// ── Truck Entry: Add / Edit modal ─────────────────────────
const showTruckModal = ref(false)
const truckModalMode = ref('add')
const savingTruck = ref(false)
const truckForm = reactive({ id: '', owner_name: '', owner_mobile_number: '', picture_url: '' })
const truckPictureFile = ref(null)

const openAddTruck = () => {
  truckModalMode.value = 'add'
  truckForm.id = ''
  truckForm.owner_name = ''
  truckForm.owner_mobile_number = ''
  truckForm.picture_url = ''
  truckPictureFile.value = null
  showTruckModal.value = true
}

const openEditTruck = (truck) => {
  truckModalMode.value = 'edit'
  truckForm.id = truck.id
  truckForm.owner_name = truck.owner_name
  truckForm.owner_mobile_number = truck.owner_mobile_number || ''
  truckForm.picture_url = truck.picture_url || ''
  truckPictureFile.value = null
  showTruckModal.value = true
}

const saveTruck = async () => {
  savingTruck.value = true
  try {
    let pictureUrl = truckForm.picture_url
    if (truckPictureFile.value) {
      pictureUrl = await uploadPhoto(truckPictureFile.value)
    }

    if (truckModalMode.value === 'add') {
      await $fetch('/api/trucks', {
        method: 'POST',
        body: {
          project_id: props.projectId,
          owner_name: truckForm.owner_name,
          owner_mobile_number: truckForm.owner_mobile_number,
          picture_url: pictureUrl
        }
      })
    } else {
      await $fetch(`/api/truck/${truckForm.id}`, {
        method: 'PATCH',
        body: {
          owner_name: truckForm.owner_name,
          owner_mobile_number: truckForm.owner_mobile_number,
          picture_url: pictureUrl
        }
      })
    }
    showTruckModal.value = false
    await fetchTrucks()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save truck')
  } finally {
    savingTruck.value = false
  }
}

const deleteTruck = async (truck) => {
  if (!confirm(`Delete truck owned by "${truck.owner_name}"? This cannot be undone.`)) return
  try {
    await $fetch(`/api/truck/${truck.id}`, { method: 'DELETE' })
    await fetchTrucks()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to delete truck')
  }
}

// ── Truck Driver Entry: Assign / Replace modal ────────────
const showDriverModal = ref(false)
const savingDriver = ref(false)
const driverTruck = ref(null)
const driverForm = reactive({ driver_name: '', mobile_number: '' })
const driverPictureFile = ref(null)
const driverCnicFile = ref(null)

const openDriverModal = (truck) => {
  driverTruck.value = truck
  driverForm.driver_name = truck.driver?.driver_name || ''
  driverForm.mobile_number = truck.driver?.mobile_number || ''
  driverPictureFile.value = null
  driverCnicFile.value = null
  showDriverModal.value = true
}

const saveDriver = async () => {
  savingDriver.value = true
  try {
    const [picture_url, cnic_picture_url] = await Promise.all([
      driverPictureFile.value ? uploadPhoto(driverPictureFile.value) : (driverTruck.value.driver?.picture_url || null),
      driverCnicFile.value ? uploadPhoto(driverCnicFile.value) : (driverTruck.value.driver?.cnic_picture_url || null)
    ])

    await $fetch('/api/truck-drivers', {
      method: 'POST',
      body: {
        truck_id: driverTruck.value.id,
        driver_name: driverForm.driver_name,
        mobile_number: driverForm.mobile_number,
        picture_url,
        cnic_picture_url
      }
    })
    showDriverModal.value = false
    await fetchTrucks()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save driver')
  } finally {
    savingDriver.value = false
  }
}

// ── Driver History modal ──────────────────────────────────
const showHistoryModal = ref(false)
const loadingHistory = ref(false)
const historyTruck = ref(null)
const driverHistory = ref([])

const formatDateTime = (iso) => {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const openHistoryModal = async (truck) => {
  historyTruck.value = truck
  showHistoryModal.value = true
  loadingHistory.value = true
  driverHistory.value = []
  try {
    driverHistory.value = await $fetch('/api/truck-drivers', { query: { truck_id: truck.id } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load driver history')
  } finally {
    loadingHistory.value = false
  }
}
</script>

<template>
  <div class="space-y-6">

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Trucks</p>
        <p class="text-2xl font-bold text-gray-800">{{ totalTrucks }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">{{ isToday ? 'Present Today' : `Present on ${selectedDate}` }}</p>
        <p class="text-2xl font-bold text-green-600">{{ presentToday.length }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Without Driver</p>
        <p class="text-2xl font-bold text-red-600">{{ trucks.filter(t => !t.driver).length }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingTrucks" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Truck Daily Attendance -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div class="flex items-center justify-between flex-wrap gap-3 gap-y-2 mb-4">
          <h4 class="font-bold text-gray-700">{{ isToday ? 'Truck Daily Attendance' : 'Attendance History' }}</h4>
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

        <div v-if="loadingAttendance" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
        </div>

        <div v-else-if="trucks.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No trucks added yet.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="truck in trucks"
            :key="truck.id"
            class="flex items-center justify-between flex-wrap gap-y-2 p-3 bg-gray-50 rounded-md"
          >
            <div class="min-w-0 mr-3">
              <p class="text-sm font-bold text-gray-800 truncate">{{ truck.owner_name }}</p>
              <div class="flex items-center mt-1 space-x-2">
                <p class="text-xs text-gray-500">{{ getAttendance(truck.id)?.driver_name || truck.driver?.driver_name || 'No driver' }}</p>
                <span
                  v-if="getAttendance(truck.id)"
                  :class="['text-xs px-2 py-0.5 rounded border font-medium', attendanceBadge(getAttendance(truck.id))]"
                >
                  {{ attendanceLabel(getAttendance(truck.id)) }}
                </span>
              </div>
            </div>
            <div class="flex space-x-1 flex-shrink-0">
              <!-- Read-only badge (past dates are history, not editable) -->
              <span
                v-if="readonly || !isToday"
                :class="['text-xs px-2 py-1 rounded border font-medium', attendanceBadge(getAttendance(truck.id))]"
              >
                {{ attendanceLabel(getAttendance(truck.id)) }}
              </span>
              <!-- Editable Yes/No buttons (today only) -->
              <template v-else>
                <button
                  @click="markAttendance(truck, true)"
                  :disabled="savingAttendance[truck.id] === 'yes'"
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded border transition',
                    'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
                    getAttendance(truck.id)?.present === true ? 'ring-2 ring-offset-1 ring-green-400' : '',
                    savingAttendance[truck.id] === 'yes' ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  {{ savingAttendance[truck.id] === 'yes' ? '...' : 'Yes' }}
                </button>
                <button
                  @click="markAttendance(truck, false)"
                  :disabled="savingAttendance[truck.id] === 'no'"
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded border transition',
                    'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
                    getAttendance(truck.id)?.present === false ? 'ring-2 ring-offset-1 ring-red-400' : '',
                    savingAttendance[truck.id] === 'no' ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  {{ savingAttendance[truck.id] === 'no' ? '...' : 'No' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Trucks List Panel -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-bold text-gray-700">Trucks</h4>
          <button v-if="!readonly" @click="openAddTruck" class="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded hover:bg-yellow-700 transition">
            + Add Truck
          </button>
        </div>

        <div v-if="trucks.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No trucks added yet.
        </div>

        <div v-else class="space-y-3">
          <div v-for="truck in trucks" :key="truck.id" class="border border-gray-100 rounded-lg p-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3 min-w-0">
                <img
                  v-if="truck.picture_url"
                  :src="truck.picture_url"
                  @click="openPreview(truck.picture_url)"
                  class="w-12 h-12 rounded object-cover flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-80 transition"
                />
                <div v-else class="w-12 h-12 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-lg">🚚</div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-gray-800 truncate">{{ truck.owner_name }}</p>
                  <p class="text-xs text-gray-500">{{ truck.owner_mobile_number || '—' }}</p>
                </div>
              </div>
              <div v-if="!readonly" class="flex space-x-3 flex-shrink-0">
                <button @click="openEditTruck(truck)" class="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Edit</button>
                <button @click="deleteTruck(truck)" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-y-2">
              <div class="flex items-center space-x-3 min-w-0">
                <img
                  v-if="truck.driver?.picture_url"
                  :src="truck.driver.picture_url"
                  @click="openPreview(truck.driver.picture_url)"
                  class="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-80 transition"
                />
                <div v-else class="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">👤</div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-gray-700 truncate">{{ truck.driver?.driver_name || 'No driver assigned' }}</p>
                  <p class="text-xs text-gray-400">{{ truck.driver?.mobile_number || '' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0 ml-2">
                <button
                  @click="openHistoryModal(truck)"
                  class="text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap"
                >
                  History
                </button>
                <button
                  v-if="!readonly"
                  @click="openDriverModal(truck)"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  {{ truck.driver ? 'Replace Driver' : 'Assign Driver' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Truck Entry: Add / Edit Modal -->
    <div v-if="showTruckModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">{{ truckModalMode === 'add' ? 'Add Truck' : 'Edit Truck' }}</h3>
        <form @submit.prevent="saveTruck" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Owner Name <span class="text-red-500">*</span></label>
            <input v-model="truckForm.owner_name" type="text" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Owner Mobile Number</label>
            <input v-model="truckForm.owner_mobile_number" type="text" class="mt-1 block w-full border rounded p-2 text-sm" placeholder="Optional" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Truck Picture</label>
            <input
              type="file"
              accept="image/*"
              @change="e => truckPictureFile = e.target.files[0]"
              class="mt-1 block w-full text-sm"
            />
            <img v-if="truckForm.picture_url && !truckPictureFile" :src="truckForm.picture_url" class="mt-2 w-16 h-16 rounded object-cover border border-gray-200" />
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button @click="showTruckModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
            <button type="submit" :disabled="savingTruck" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm">
              {{ savingTruck ? 'Saving...' : (truckModalMode === 'add' ? 'Add Truck' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Truck Driver Entry: Assign / Replace Modal -->
    <div v-if="showDriverModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-1">{{ driverTruck?.driver ? 'Replace Driver' : 'Assign Driver' }}</h3>
        <p class="text-xs text-gray-500 mb-4">Truck owner: {{ driverTruck?.owner_name }}</p>
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
              {{ savingDriver ? 'Saving...' : (driverTruck?.driver ? 'Replace Driver' : 'Assign Driver') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Driver History Modal -->
    <div v-if="showHistoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-1">Driver History</h3>
        <p class="text-xs text-gray-500 mb-4">Truck owner: {{ historyTruck?.owner_name }}</p>

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
