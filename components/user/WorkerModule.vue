<script setup>
const client = useSupabaseClient()
const workers = ref([])
const loading = ref(true)

const fetchWorkers = async () => {
  loading.value = true
  const { data, error } = await client.from('workers').select('*').order('name')
  if (!error) workers.value = data
  loading.value = false
}

const submitAttendance = async (workerId, status) => {
  const { error } = await client.from('worker_attendance').upsert({
    worker_id: workerId,
    date: new Date().toISOString().split('T')[0],
    status
  })
  if (error) alert(error.message)
  else alert('Attendance recorded!')
}

onMounted(fetchWorkers)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h3 class="text-xl font-bold text-gray-800">Worker Management</h3>
      <button class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition">
        + New Worker
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Attendance Section -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-4 flex items-center">
          <span class="mr-2">📅</span> Daily Attendance ({{ new Date().toLocaleDateString() }})
        </h4>
        <div class="space-y-3">
          <div v-for="worker in workers.filter(w => w.status === 'active')" :key="worker.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div>
              <p class="text-sm font-bold text-gray-800">{{ worker.name }}</p>
              <p class="text-xs text-gray-500">Rs. {{ worker.daily_salary }} / day</p>
            </div>
            <div class="flex space-x-1">
              <button @click="submitAttendance(worker.id, 'day')" class="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition border border-green-200">Day</button>
              <button @click="submitAttendance(worker.id, 'night')" class="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition border border-blue-200">Night</button>
              <button @click="submitAttendance(worker.id, 'leave')" class="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition border border-red-200">Leave</button>
            </div>
          </div>
          <div v-if="!workers.some(w => w.status === 'active')" class="text-center py-4 text-gray-400 italic text-sm">
            No active workers found.
          </div>
        </div>
      </div>

      <!-- Worker List Section -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-4 flex items-center">
          <span class="mr-2">👥</span> Active Workers
        </h4>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-600">
              <tr>
                <th class="px-3 py-2 font-bold">Name</th>
                <th class="px-3 py-2 font-bold">Mobile</th>
                <th class="px-3 py-2 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="worker in workers" :key="worker.id" class="hover:bg-gray-50 transition">
                <td class="px-3 py-3">
                  <span :class="worker.status === 'active' ? 'text-green-600' : 'text-gray-400'">●</span>
                  {{ worker.name }}
                </td>
                <td class="px-3 py-3 text-gray-500">{{ worker.mobile_number || 'N/A' }}</td>
                <td class="px-3 py-3 text-right">
                  <button class="text-blue-600 hover:underline">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
