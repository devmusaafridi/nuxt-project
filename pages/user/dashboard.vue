<script setup>
definePageMeta({
  layout: false
})

const activeModule = ref('overview')

const menuItems = [
  { id: 'overview', name: 'Overview' },
  { id: 'worker', name: 'Worker' },
  { id: 'truck', name: 'Truck' },
  { id: 'excavator', name: 'Excavator Machine' },
  { id: 'plant', name: 'Plant' },
  { id: 'diesel', name: 'Diesel' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'others', name: 'Others' },
  { id: 'gold', name: 'Gold' },
  { id: 'capital', name: 'Project Capital Value' },
  { id: 'balance', name: 'User Balance' },
  { id: 'reports', name: 'Reports' },
]

const projects = ref([])
const loadingProjects = ref(true)
const projectError = ref('')

onMounted(async () => {
  try {
    projects.value = await $fetch('/api/my-project')
  } catch (err) {
    projectError.value = err?.data?.message ?? err?.message ?? 'Failed to load projects'
    console.error('[dashboard] failed to load projects:', err)
  } finally {
    loadingProjects.value = false
  }
})

const totalCapital = computed(() =>
  projects.value.reduce((sum, p) => sum + (p.capital_allocated || 0), 0)
)

const handleModuleSelect = (id) => {
  activeModule.value = id
}
</script>

<template>
  <NuxtLayout name="user" :activeModule="activeModule" :menuItems="menuItems" @select-module="handleModuleSelect">

    <!-- Overview -->
    <div v-if="activeModule === 'overview'">
      <h3 class="text-xl font-bold text-gray-800 mb-6">My Projects</h3>

      <div v-if="loadingProjects" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
      </div>

      <div v-else-if="projectError" class="flex flex-col items-center justify-center py-20 text-red-400">
        <div class="text-5xl mb-4">⚠️</div>
        <p class="text-lg font-medium">Error loading projects</p>
        <p class="text-sm mt-1">{{ projectError }}</p>
      </div>

      <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <div class="text-5xl mb-4">📋</div>
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="project in projects" :key="project.id" class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 class="text-lg font-bold text-gray-800 mb-4">{{ project.name }}</h4>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Capital Allocated</span>
              <span class="font-bold text-gray-800">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Available Balance</span>
              <span class="font-bold text-green-600">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Created</span>
              <span class="text-gray-600">{{ new Date(project.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>

        <!-- Total card if multiple projects -->
        <div v-if="projects.length > 1" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
          <h4 class="text-lg font-bold text-yellow-800 mb-4">Total</h4>
          <div class="flex justify-between text-sm">
            <span class="text-yellow-700">Total Capital</span>
            <span class="font-bold text-yellow-800">Rs. {{ totalCapital.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Worker module -->
    <div v-else-if="activeModule === 'worker'">
      <div v-if="!projects.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>
      <UserWorkerModule v-else :projectId="projects[0].id" />
    </div>

    <!-- Truck module -->
    <div v-else-if="activeModule === 'truck'">
      <div v-if="!projects.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>
      <UserTruckModule v-else :projectId="projects[0].id" />
    </div>

    <!-- Excavator module -->
    <div v-else-if="activeModule === 'excavator'">
      <div v-if="!projects.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>
      <UserExcavatorModule v-else :projectId="projects[0].id" />
    </div>

    <!-- Plant module -->
    <div v-else-if="activeModule === 'plant'">
      <div v-if="!projects.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>
      <UserPlantModule v-else :projectId="projects[0].id" />
    </div>

    <!-- Diesel module -->
    <div v-else-if="activeModule === 'diesel'">
      <div v-if="!projects.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>
      <UserDieselModule v-else :projectId="projects[0].id" />
    </div>

    <!-- Maintenance module -->
    <div v-else-if="activeModule === 'maintenance'">
      <div v-if="!projects.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>
      <UserMaintenanceModule v-else :projectId="projects[0].id" />
    </div>

    <!-- Others module -->
    <div v-else-if="activeModule === 'others'">
      <div v-if="!projects.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No project assigned yet.</p>
        <p class="text-sm">Please contact your administrator.</p>
      </div>
      <UserOthersModule v-else :projectId="projects[0].id" />
    </div>

    <!-- Other modules -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
      <div class="text-6xl mb-4">🏗️</div>
      <p class="text-lg font-medium">This module is under construction.</p>
      <p class="text-sm">We are working hard to bring this feature to you.</p>
    </div>

  </NuxtLayout>
</template>
