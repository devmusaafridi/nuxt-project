<script setup>
definePageMeta({
  layout: 'user'
})

const activeModule = ref('worker')

const menuItems = [
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

const activeModuleName = computed(() => {
  return menuItems.find(i => i.id === activeModule.value)?.name || 'Dashboard'
})

const handleModuleSelect = (id) => {
  activeModule.value = id
}
</script>

<template>
  <NuxtLayout name="user" :activeModule="activeModule" :menuItems="menuItems" @select-module="handleModuleSelect">
    <div v-if="activeModule === 'worker'">
      <UserWorkerModule />
    </div>

    <div v-else-if="activeModule === 'diesel'">
      <UserDieselModule />
    </div>

    <!-- Other modules will be implemented similarly -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
      <div class="text-6xl mb-4">🏗️</div>
      <p class="text-lg font-medium">Module "{{ activeModuleName }}" is under construction.</p>
      <p class="text-sm">We are working hard to bring this feature to you.</p>
    </div>
  </NuxtLayout>
</template>
