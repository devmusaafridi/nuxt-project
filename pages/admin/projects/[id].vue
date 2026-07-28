<script setup>
definePageMeta({
  layout: 'admin'
})

const route = useRoute()

const project = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    project.value = await $fetch(`/api/project/${route.params.id}`)
  } catch (err) {
    error.value = err?.data?.message ?? err?.message ?? 'Failed to load project'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 text-red-500">
      <p class="text-lg font-medium">{{ error }}</p>
      <NuxtLink to="/admin" class="mt-4 text-sm text-yellow-600 hover:underline">← Back to Projects</NuxtLink>
    </div>

    <!-- Project Dashboard -->
    <div v-else-if="project">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-y-2 mb-6">
        <div class="min-w-0">
          <NuxtLink to="/admin" class="text-sm text-yellow-600 hover:underline">← Back to Projects</NuxtLink>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mt-1 truncate">{{ project.name }}</h2>
          <p class="text-sm text-gray-500 mt-1">
            Assigned to:
            <span class="font-medium text-gray-700">{{ project.assigned_user?.username || 'Unassigned' }}</span>
          </p>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="text-xs text-gray-400 uppercase font-semibold">Created</p>
          <p class="text-sm text-gray-600">{{ new Date(project.created_at).toLocaleDateString() }}</p>
        </div>
      </div>

      <!-- Finance Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <p class="text-xs text-gray-500 uppercase font-bold mb-1">Capital Allocated</p>
          <p class="text-2xl font-bold text-gray-800">Rs. {{ project.capital_allocated?.toLocaleString() }}</p>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Expenses</p>
          <p class="text-2xl font-bold text-gray-800">Rs. 0</p>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
          <p class="text-xs text-gray-500 uppercase font-bold mb-1">Remaining Balance</p>
          <p class="text-2xl font-bold text-green-600">Rs. {{ project.capital_allocated?.toLocaleString() }}</p>
        </div>
      </div>

      <!-- Full interactive worker module for admin -->
      <UserWorkerModule :projectId="project.id" />

      <!-- Full interactive truck module for admin -->
      <div class="mt-8">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Truck Module</h3>
        <UserTruckModule :projectId="project.id" />
      </div>

      <!-- Full interactive excavator module for admin -->
      <div class="mt-8">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Excavator Machine Module</h3>
        <UserExcavatorModule :projectId="project.id" />
      </div>

      <!-- Full interactive plant module for admin -->
      <div class="mt-8">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Plant Module</h3>
        <UserPlantModule :projectId="project.id" />
      </div>

      <!-- Full interactive diesel module for admin -->
      <div class="mt-8">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Diesel Module</h3>
        <UserDieselModule :projectId="project.id" />
      </div>
    </div>
  </div>
</template>
