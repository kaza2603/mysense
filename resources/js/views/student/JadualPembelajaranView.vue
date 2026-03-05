<script setup>
import { ref, computed } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-vue-next'
import router from '@/router'

const selectedDate = ref(new Date())
const todos = ref({}) // Store todos as { 'YYYY-MM-DD': ['todo1', 'todo2'] }
const newTodoText = ref('')

// Format date to YYYY-MM-DD for consistent keys
const formatDateKey = (date) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDateKey = computed(() => formatDateKey(selectedDate.value))

const todosForSelectedDate = computed(() => {
  return todos.value[selectedDateKey.value] || []
})

const addTodo = () => {
  const text = newTodoText.value.trim()
  if (!text || !selectedDate.value) return

  const key = selectedDateKey.value
  if (!todos.value[key]) {
    todos.value[key] = []
  }
  todos.value[key].push(text)
  newTodoText.value = '' // Clear input
}

const removeTodo = (index) => {
  const key = selectedDateKey.value
  if (todos.value[key]) {
    todos.value[key].splice(index, 1)
    // Optional: Clean up the date key if no todos are left
    if (todos.value[key].length === 0) {
      delete todos.value[key]
    }
  }
}

const goBack = () => {
  router.back()
  console.log('Go back to the previous page')
}

// Highlight dates with todos
const highlightedDates = computed(() => {
  return Object.keys(todos.value).map((dateStr) => new Date(dateStr + 'T00:00:00')) // Ensure correct date object parsing
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <Button variant="outline" size="sm" @click="goBack" class="mb-4">
      <ArrowLeft class="h-4 w-4 mr-2" />
      Kembali
    </Button>

    <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
      Jadual Pembelajaran Saya
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Calendar -->
      <div class="lg:col-span-1">
        <Card class="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle class="text-xl">Kalendar</CardTitle>
            <CardDescription>Pilih tarikh untuk melihat atau menambah tugasan.</CardDescription>
          </CardHeader>
          <CardContent class="p-4">
            <VueDatePicker
              v-model="selectedDate"
              inline
              auto-apply
              :enable-time-picker="false"
              locale="ms"
              week-start="0"
              :highlight="highlightedDates"
              highlight-disabled-days
              calendar-cell-class-name="dp-custom-cell"
              aria-label="Kalendar Pemilihan Tarikh"
              month-name-format="long"
              :day-names="['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab']"
            />
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-3">
              * Tarikh dengan tugasan ditandakan.
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Todos for selected date -->
      <div class="lg:col-span-2">
        <Card class="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle class="text-xl"
              >Tugasan untuk:
              <span class="font-semibold text-yellow-600 dark:text-yellow-400">{{
                selectedDate
                  ? selectedDate.toLocaleDateString('ms-MY', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Tarikh Dipilih'
              }}</span></CardTitle
            >
            <CardDescription>Tambah atau lihat tugasan anda di sini.</CardDescription>
          </CardHeader>
          <CardContent class="p-4">
            <!-- Add Todo Form -->
            <div class="flex items-end gap-2 mb-6">
              <div class="flex-grow">
                <Label for="new-todo-input" class="sr-only">Tugasan Baru</Label>
                <Input
                  id="new-todo-input"
                  v-model="newTodoText"
                  placeholder="Cth: Siapkan latihan Sains Bab 3"
                  @keyup.enter="addTodo"
                  class="flex-grow"
                  aria-label="Input untuk tugasan baru"
                />
              </div>
              <Button @click="addTodo" :disabled="!newTodoText.trim()" aria-label="Tambah Tugasan">
                <PlusCircle class="h-4 w-4 mr-2" /> Tambah
              </Button>
            </div>

            <!-- Todo List -->
            <h3 class="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
              Senarai Tugasan:
            </h3>
            <div v-if="todosForSelectedDate.length > 0" class="space-y-3">
              <div
                v-for="(todo, index) in todosForSelectedDate"
                :key="`${selectedDateKey}-${index}`"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                <span class="text-gray-800 dark:text-gray-100">{{ todo }}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="removeTodo(index)"
                  class="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                  :aria-label="`Padam tugasan: ${todo}`"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div
              v-else
              class="text-center text-gray-500 dark:text-gray-400 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <p>Tiada tugasan untuk tarikh ini.</p>
              <p class="text-sm">Tambah tugasan menggunakan borang di atas.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style>
/* Improve Datepicker styles for WCAG and appeal */
.dp__theme_light {
  --dp-background-color: #ffffff;
  --dp-text-color: #212121;
  --dp-hover-color: #f3f3f3;
  --dp-hover-text-color: #212121;
  --dp-hover-icon-color: #959595;
  --dp-primary-color: #f59e0b; /* Tailwind yellow-500 */
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #a7a7a7;
  --dp-border-color: #ddd;
  --dp-menu-border-color: #ddd;
  --dp-border-color-hover: #aaa;
  --dp-disabled-color: #d1d5db; /* Tailwind gray-300 */
  --dp-scroll-bar-background: #f3f3f3;
  --dp-scroll-bar-color: #959595;
  --dp-success-color: #76d275;
  --dp-success-color-disabled: #a3d9b1;
  --dp-icon-color: #959595;
  --dp-danger-color: #ff6f60;
  --dp-highlight-color: rgba(251, 191, 36, 0.2); /* Tailwind yellow-400 with opacity */
}

/* Custom styling for highlighted dates */
.dp-custom-cell.dp__cell_highlight {
  background-color: var(--dp-highlight-color);
  border: 1px solid var(--dp-primary-color);
  border-radius: 50%;
  font-weight: 600; /* Semibold */
}
.dp-custom-cell.dp__active_date {
  background-color: var(--dp-primary-color);
  color: var(--dp-primary-text-color);
  border-radius: 50%;
}
.dp__today {
  border: 1px solid var(--dp-primary-color);
  border-radius: 50%;
}

/* Ensure calendar text has good contrast */
.dp__calendar_header,
.dp__calendar_item,
.dp__month_year_row {
  color: var(--dp-text-color);
}
.dp__cell_inner:hover {
  background-color: var(--dp-hover-color);
  color: var(--dp-hover-text-color);
  border-radius: 50%;
}

/* Improve focus states for accessibility */
.dp__cell_inner:focus {
  outline: 2px solid var(--dp-primary-color);
  outline-offset: 1px;
  border-radius: 50%;
}
.dp__calendar_header_item:focus {
  outline: 2px solid var(--dp-primary-color);
  outline-offset: 1px;
}
.dp__action_button:focus {
  outline: 2px solid var(--dp-primary-color);
  outline-offset: 1px;
}
</style>
