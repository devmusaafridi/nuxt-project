<script setup>
const client = useSupabaseClient()
const dieselIn = ref([])
const dieselOut = ref([])

const fetchDieselData = async () => {
  const { data: dataIn } = await client.from('diesel_in').select('*')
  const { data: dataOut } = await client.from('diesel_out').select('*')
  dieselIn.value = dataIn || []
  dieselOut.value = dataOut || []
}

const totalIn = computed(() => dieselIn.value.reduce((sum, item) => sum + Number(item.litres), 0))
const totalOut = computed(() => dieselOut.value.reduce((sum, item) => sum + Number(item.litres), 0))
const remaining = computed(() => totalIn.value - totalOut.value)

onMounted(fetchDieselData)
</script>

<template>
  <div class="space-y-8">
    <!-- Stats Header -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-100 shadow-sm">
        <p class="text-xs text-yellow-600 uppercase font-bold mb-1 tracking-wider">Total Diesel In</p>
        <p class="text-3xl font-bold text-gray-800">{{ totalIn }} <span class="text-lg font-normal">Litres</span></p>
      </div>
      <div class="bg-red-50 p-6 rounded-lg border border-red-100 shadow-sm">
        <p class="text-xs text-red-600 uppercase font-bold mb-1 tracking-wider">Total Diesel Out</p>
        <p class="text-3xl font-bold text-gray-800">{{ totalOut }} <span class="text-lg font-normal">Litres</span></p>
      </div>
      <div class="bg-green-50 p-6 rounded-lg border border-green-100 shadow-sm border-b-4 border-b-green-500">
        <p class="text-xs text-green-600 uppercase font-bold mb-1 tracking-wider">Remaining Diesel</p>
        <p class="text-3xl font-bold text-gray-800">{{ remaining }} <span class="text-lg font-normal">Litres</span></p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Diesel In Form -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-6 flex items-center justify-between">
          <span>⛽ Record Diesel In</span>
          <button class="text-xs text-yellow-600 hover:underline">View History</button>
        </h4>
        <form class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Litres</label>
              <input type="number" class="w-full border rounded p-2 text-sm" placeholder="e.g. 500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Price per Litre</label>
              <input type="number" class="w-full border rounded p-2 text-sm" placeholder="PKR" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Diesel Slip Image</label>
            <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition">
              <span class="text-xs text-gray-400">Click to upload slip image</span>
            </div>
          </div>
          <button class="w-full bg-yellow-600 text-white font-bold py-2 rounded hover:bg-yellow-700 transition shadow-sm">
            Record Diesel In
          </button>
        </form>
      </div>

      <!-- Diesel Out Form -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 class="font-bold text-gray-700 mb-6 flex items-center justify-between">
          <span>🚜 Diesel Consumption (Out)</span>
          <button class="text-xs text-red-600 hover:underline">View History</button>
        </h4>
        <form class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Consumption Source</label>
            <select class="w-full border rounded p-2 text-sm bg-white">
              <option value="truck">Truck</option>
              <option value="excavator">Excavator Machine</option>
              <option value="generator">Generator</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Litres Consumed</label>
              <input type="number" class="w-full border rounded p-2 text-sm" placeholder="0.00" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" class="w-full border rounded p-2 text-sm" :value="new Date().toISOString().split('T')[0]" />
            </div>
          </div>
          <button class="w-full bg-gray-800 text-white font-bold py-2 rounded hover:bg-gray-900 transition shadow-sm">
            Record Consumption
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
