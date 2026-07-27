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
  <div class="min-h-screen flex flex-col" style="background:#f3f4f6;">
    <header class="relative overflow-hidden flex-shrink-0" style="background:#0d0d0d; min-height:80px;">
      <div class="absolute inset-0 bg-cover bg-center" style="background-image:url('/mine-design.jpeg'); opacity:0.2;"></div>
      <div class="absolute inset-0" style="background:linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%);"></div>
      <div class="relative z-10 flex items-center justify-between px-8 py-4">
        <div class="flex items-center space-x-4">
          <img src="/sidebar-logo.png" alt="Zam Zam Gold Mine" class="w-30 h-28 object-contain" />
          <div>
            <h1 class="text-white font-bold text-lg leading-tight">Zam Zam Gold Mine</h1>
            <p class="text-xs uppercase tracking-widest" style="color:#d4a017;">Management System</p>
          </div>
        </div>
        <NuxtLink to="/visitor" class="text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-md transition">
          ← Back to Projects
        </NuxtLink>
      </div>
    </header>

    <main class="flex-grow p-8 overflow-auto">
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

        <!-- Read-only Truck Module -->
        <div class="mt-8">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Truck Module</h3>
          <UserTruckModule :projectId="project.id" :readonly="true" />
        </div>
      </div>
    </main>
  </div>
</template>
