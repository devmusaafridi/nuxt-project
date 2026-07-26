<script setup>
const route = useRoute()
const project = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
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
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <header class="bg-gray-800 text-white shadow-md py-4 px-6 flex justify-between items-center">
      <h1 class="text-xl font-bold">Zam Zam Gold Mine - Visitor Portal</h1>
      <NuxtLink to="/visitor" class="text-sm text-gray-300 hover:text-white transition">← Back to Projects</NuxtLink>
    </header>

    <main class="flex-grow p-6 overflow-auto">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-20 text-red-500">
        <p class="text-lg font-medium">{{ error }}</p>
        <NuxtLink to="/visitor" class="mt-4 text-sm text-gray-600 hover:underline">← Back to Projects</NuxtLink>
      </div>

      <div v-else-if="project">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">{{ project.name }}</h2>
            <p class="text-sm text-gray-500 mt-1">
              Assigned to: <span class="font-medium text-gray-700">{{ project.assigned_user?.username || 'Unassigned' }}</span>
            </p>
          </div>
          <div class="text-right">
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

        <!-- Read-only Worker Module -->
        <UserWorkerModule :projectId="project.id" :readonly="true" />
      </div>
    </main>
  </div>
</template>
