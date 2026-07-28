<script setup>
const props = defineProps({
  projectId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})

const todayISO = new Date().toISOString().split('T')[0]
const selectedDate = ref(todayISO)
const isToday = computed(() => selectedDate.value === todayISO)

const plants = ref([])
const sessions = ref([])
const loadingPlants = ref(true)
const loadingSessions = ref(false)

// ── Summary ──────────────────────────────────────────────
const totalPlants = computed(() => plants.value.length)
const workingToday = computed(() => new Set(sessions.value.map(s => s.plant_id)).size)
const totalHoursToday = computed(() => sessions.value.reduce((sum, s) => sum + sessionHours(s), 0))

// ── Session helpers ────────────────────────────────────────
const sessionsFor = (plantId) => sessions.value.filter(s => s.plant_id === plantId)

const sessionHours = (session) => {
  const [sh, sm] = session.start_time.split(':').map(Number)
  const [eh, em] = session.end_time.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff / 60 : 0
}

const totalHoursFor = (plantId) => sessionsFor(plantId).reduce((sum, s) => sum + sessionHours(s), 0)

const formatTime = (time) => {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// ── Fetch ─────────────────────────────────────────────────
const fetchPlants = async () => {
  try {
    plants.value = await $fetch('/api/plants', { query: { projectId: props.projectId } })
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to load plants')
  } finally {
    loadingPlants.value = false
  }
}

const fetchSessions = async () => {
  loadingSessions.value = true
  try {
    sessions.value = await $fetch('/api/plant-working-hours', { query: { projectId: props.projectId, date: selectedDate.value } })
  } catch (err) {
    console.error('Failed to load plant working hours:', err)
  } finally {
    loadingSessions.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchPlants(), fetchSessions()])
})

watch(selectedDate, () => {
  fetchSessions()
})

// ── Plant Entry: Add / Edit modal ─────────────────────────
const showPlantModal = ref(false)
const plantModalMode = ref('add')
const savingPlant = ref(false)
const plantForm = reactive({ id: '', name: '' })

const openAddPlant = () => {
  plantModalMode.value = 'add'
  plantForm.id = ''
  plantForm.name = ''
  showPlantModal.value = true
}

const openEditPlant = (plant) => {
  plantModalMode.value = 'edit'
  plantForm.id = plant.id
  plantForm.name = plant.name
  showPlantModal.value = true
}

const savePlant = async () => {
  savingPlant.value = true
  try {
    if (plantModalMode.value === 'add') {
      await $fetch('/api/plants', {
        method: 'POST',
        body: { project_id: props.projectId, name: plantForm.name }
      })
    } else {
      await $fetch(`/api/plant/${plantForm.id}`, {
        method: 'PATCH',
        body: { name: plantForm.name }
      })
    }
    showPlantModal.value = false
    await fetchPlants()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to save plant')
  } finally {
    savingPlant.value = false
  }
}

const deletePlant = async (plant) => {
  if (!confirm(`Delete plant "${plant.name}"? This cannot be undone.`)) return
  try {
    await $fetch(`/api/plant/${plant.id}`, { method: 'DELETE' })
    await fetchPlants()
  } catch (err) {
    alert(err?.data?.message ?? err?.message ?? 'Failed to delete plant')
  }
}

// ── Working Session: Add modal ────────────────────────────
const showSessionModal = ref(false)
const savingSession = ref(false)
const sessionPlant = ref(null)
const sessionForm = reactive({ start_time: '', end_time: '' })

const openSessionModal = (plant) => {
  sessionPlant.value = plant
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
    await $fetch('/api/plant-working-hours', {
      method: 'POST',
      body: {
        plant_id: sessionPlant.value.id,
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
    await $fetch(`/api/plant-working-hour/${session.id}`, { method: 'DELETE' })
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
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Plants</p>
        <p class="text-2xl font-bold text-gray-800">{{ totalPlants }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">{{ isToday ? 'Total Hours Today' : `Total Hours on ${selectedDate}` }}</p>
        <p class="text-2xl font-bold text-green-600">{{ totalHoursToday.toFixed(1) }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">{{ isToday ? 'Working Today' : `Working on ${selectedDate}` }}</p>
        <p class="text-2xl font-bold text-gray-800">{{ workingToday }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingPlants" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Plant Working Hours -->
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

        <div v-else-if="plants.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No plants added yet.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="plant in plants"
            :key="plant.id"
            class="p-3 bg-gray-50 rounded-md"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-bold text-gray-800 truncate mr-3">{{ plant.name }}</p>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-xs font-semibold text-gray-600">{{ totalHoursFor(plant.id).toFixed(1) }} hrs</span>
                <button
                  v-if="!readonly && isToday"
                  @click="openSessionModal(plant)"
                  class="text-xs text-yellow-700 hover:underline whitespace-nowrap"
                >
                  + Add Session
                </button>
              </div>
            </div>

            <div v-if="sessionsFor(plant.id).length === 0" class="text-xs text-gray-400 italic">
              No sessions {{ isToday ? 'logged yet' : 'recorded' }}.
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <span
                v-for="session in sessionsFor(plant.id)"
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

      <!-- Plants List Panel -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-bold text-gray-700">Plants</h4>
          <button v-if="!readonly" @click="openAddPlant" class="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded hover:bg-yellow-700 transition">
            + Add Plant
          </button>
        </div>

        <div v-if="plants.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
          No plants added yet.
        </div>

        <div v-else class="space-y-3">
          <div v-for="plant in plants" :key="plant.id" class="flex items-center justify-between border border-gray-100 rounded-lg p-3">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-10 h-10 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-lg">🏭</div>
              <p class="text-sm font-bold text-gray-800 truncate">{{ plant.name }}</p>
            </div>
            <div v-if="!readonly" class="flex space-x-3 flex-shrink-0">
              <button @click="openEditPlant(plant)" class="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Edit</button>
              <button @click="deletePlant(plant)" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Plant Entry: Add / Edit Modal -->
    <div v-if="showPlantModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">{{ plantModalMode === 'add' ? 'Add Plant' : 'Edit Plant' }}</h3>
        <form @submit.prevent="savePlant" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Plant Name <span class="text-red-500">*</span></label>
            <input v-model="plantForm.name" type="text" required class="mt-1 block w-full border rounded p-2 text-sm" />
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button @click="showPlantModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancel</button>
            <button type="submit" :disabled="savingPlant" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm">
              {{ savingPlant ? 'Saving...' : (plantModalMode === 'add' ? 'Add Plant' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Working Session: Add Modal -->
    <div v-if="showSessionModal && !readonly" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-1">Add Working Session</h3>
        <p class="text-xs text-gray-500 mb-4">{{ sessionPlant?.name }} — {{ selectedDate }}</p>
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

  </div>
</template>
