<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { valueUpdater } from '@/lib/utils'

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
})
</script>

<template>
  <div>
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="{ 'cursor-pointer select-none': header.column.getCanSort() }"
              @click="header.column.getCanSort() && header.column.toggleSorting()"
            >
              <div class="flex items-center gap-2">
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <ChevronDown
                  v-if="header.column.getCanSort()"
                  :class="[
                    'h-4 w-4',
                    {
                      'rotate-180 transform': header.column.getIsSorted() === 'desc',
                      invisible: !header.column.getIsSorted(),
                    },
                  ]"
                />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="table.getRowModel().rows.length === 0">
            <TableCell :colspan="columns.length" class="h-24 text-center"> No results. </TableCell>
          </TableRow>
          <TableRow
            v-else
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :data-state="row.getIsSelected() ? 'selected' : undefined"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <slot name="cell" :cell="cell" :row="row" :value="cell.getValue()">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </slot>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2 py-4">
      <div
        class="flex flex-col space-y-2 lg:space-y-0 lg:flex-row lg:justify-between w-full items-center"
      >
        <div class="flex items-center space-x-2">
          <p class="text-sm font-medium">Rows per page</p>
          <Select
            :model-value="table.getState().pagination.pageSize"
            @update:model-value="table.setPageSize"
          >
            <SelectTrigger class="h-8 w-[70px]">
              <SelectValue :placeholder="String(table.getState().pagination.pageSize)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="size in [10, 20, 30, 40, 50]" :key="size" :value="size">
                {{ size }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
        </div>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
