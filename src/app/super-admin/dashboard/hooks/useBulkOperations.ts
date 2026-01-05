// Hook for bulk operations utilities
// This provides common bulk operation logic and state management

import { useState } from 'react';

export function useBulkOperations() {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    setSelectAll(false); // Reset select all when individual selection changes
  };

  const toggleSelectAll = (items: any[], idKey: string = 'id') => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
      setShowCheckboxes(false);
    } else {
      const allIds = items.map(item => item[idKey]);
      setSelectedItems(new Set(allIds));
      setSelectAll(true);
      setShowCheckboxes(true);
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectAll(false);
    setShowCheckboxes(false);
  };

  const isSelected = (id: number) => selectedItems.has(id);

  const selectedCount = selectedItems.size;

  return {
    selectedItems: Array.from(selectedItems),
    showCheckboxes,
    selectAll,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isSelected,
    selectedCount,
    setShowCheckboxes
  };
}