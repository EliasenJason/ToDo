'use client';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
// import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { use, useEffect, useState } from 'react';
import { CSSProperties } from 'react';
import Pusher from 'pusher-js';

const DragOverlayItem = ({ content }: { content: string }) => {
  return (
    <div style={{
      border: '1px solid gray',
      padding: '8px',
      backgroundColor: 'white',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      width: '250px',
      transition: 'none',
      transitionDuration: '0s',
      transform: 'none'
    }}>
      {content}
    </div>
  );
};

const SortableItem = ({ 
  id, 
  isEmpty, 
  content, 
  isDragging,
  currentlyDraggingId
}: { 
  id: string; 
  isEmpty: boolean; 
  content?: string;
  isDragging: boolean;
  currentlyDraggingId: string | null;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: dragRef,
    transform,
  } = useDraggable({
    id,
    disabled: isEmpty
  });

  const { setNodeRef: dropRef } = useDroppable({
    id,
    disabled: !isEmpty
  });

  const setNodeRef = (node: HTMLElement | null) => {
    dragRef(node);
    dropRef(node);
  };

  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : 'none',
    border: '1px solid gray',
    margin: '8px 0',
    padding: '8px',
    backgroundColor: isEmpty ? '#f0f0f0' : 'white',
    cursor: isEmpty ? 'default' : 'grab',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: currentlyDraggingId && !isDragging ? 'none' : undefined,
    opacity: isDragging ? 0 : 1,
    // Remove any transition properties
    transitionDuration: '0s',
    transition: 'none',
    // Disable transforms when not dragging
    // transform: isDragging ? transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : 'none' : 'none',
    // Prevent any GPU acceleration
    willChange: 'auto',
    WebkitTransform: 'none',
    MozTransform: 'none',
    msTransform: 'none'
  };

  return (
    <div 
      ref={setNodeRef}
      {...attributes} 
      {...(isEmpty ? {} : listeners)}
      style={style}
    >
      {!isEmpty && !isDragging && content}
    </div>
  );
};

interface DraggableItem {
  id: string;
  content: string;
  x: number;
  y: number;
  grid: number;
}



export default function DragAndDrop() {
  const [items, setItems] = useState<DraggableItem[]>([
    { id: '1', content: 'Item 1', x: 0, y: 0, grid: 0 },
    { id: '2', content: 'Item 2', x: 0, y: 1, grid: 0 },
    { id: '3', content: 'Item 3', x: 0, y: 2, grid: 0 },
    { id: '4', content: 'Item 4', x: 0, y: 0, grid: 1 },
    { id: '5', content: 'Item 5', x: 0, y: 1, grid: 1 },
    { id: '6', content: 'Item 6', x: 0, y: 0, grid: 2 }
  ]);

  const [capacity] = useState<number>(10);
  const [currentlyDraggingId, setCurrentlyDraggingId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null | undefined>(null);

  //initialize pusher connection when page is loaded
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // Log when connection is established
    pusher.connection.bind('connected', () => {
      console.log('Connected to Pusher');
    });

    const channel = pusher.subscribe('items-update-channel');

    channel.bind('items-update', (data: DraggableItem[]) => {
      console.log('Received update:', data);
      setItems(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('items-update-channel');
    };
  }, []);

  useEffect(() => {
    //update database
    //broadcast changes to all clients via websocket
    console.log(items);
  }, [items]);
  

  // Create separate arrays for each grid and column
  const getGridItems = (gridNumber: number, columnNumber: number) => {
    const gridItems = items.filter(item => 
      item.grid === gridNumber && item.x === columnNumber
    );
    const positions = Array(capacity).fill(null);
    
    // Fill positions based on items' y values
    gridItems.forEach(item => {
      positions[item.y] = item;
    });
    
    return positions;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    setCurrentlyDraggingId(activeId);
    
    // Find the item being dragged
    const [sourceGrid, sourceColumn, sourceIndex] = activeId.split('-').slice(1).map(Number);
    const item = items.find(item => 
      item.grid === sourceGrid && 
      item.x === sourceColumn && 
      item.y === sourceIndex
    );
    console.log(item)
    setDraggedItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setCurrentlyDraggingId(null);
    setDraggedItem(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const [sourceGrid, sourceColumn, sourceIndex] = activeId.split('-').slice(1).map(Number);
    const [targetGrid, targetColumn, targetIndex] = over.id.toString().split('-').slice(1).map(Number);

    if (activeId !== over.id) {
      setItems(currentItems => {
        const newItems = [...currentItems];
        const draggedItem = newItems.find(item => 
          item.grid === sourceGrid && 
          item.x === sourceColumn && 
          item.y === sourceIndex
        );
        
        // Check if target position is empty
        const isTargetEmpty = !newItems.some(item => 
          item.grid === targetGrid && 
          item.x === targetColumn && 
          item.y === targetIndex
        );

        if (draggedItem && isTargetEmpty) {
          draggedItem.grid = targetGrid;
          draggedItem.x = targetColumn;
          draggedItem.y = targetIndex;
        }
        const broadCastUpdate = async () => {
          try {
            const response = await fetch('/api/update-items', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(newItems)
            });
            const data = await response.json();
            console.log("update:")
            console.log(data);
          } catch (error) {
            console.error('Error:', error);
          }
        };
        broadCastUpdate();
        return newItems;
      });
    }
  };

  return (
    <DndContext 
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        {[0, 1, 2].map(gridNumber => (
          <div 
            key={gridNumber}
            style={{ 
              width: '600px',
              margin: '20px', 
              padding: '20px', 
              backgroundColor: '#f5f5f5' 
            }}
          >
            <h3>Grid {gridNumber}</h3>
            <div style={{ display: 'flex', gap: '20px' }}>
            {[0, 1].map(columnNumber => (
              <div 
                key={`grid-${gridNumber}-column-${columnNumber}`}
                style={{ flex: 1 }}
              >
                <h4>Column {columnNumber}</h4>
                {getGridItems(gridNumber, columnNumber).map((item, index) => (
                  <SortableItem 
                    key={`grid-${gridNumber}-${columnNumber}-${index}`}
                    id={`grid-${gridNumber}-${columnNumber}-${index}`}
                    isEmpty={!item}
                    content={item?.content}
                    isDragging={`grid-${gridNumber}-${columnNumber}-${index}` === currentlyDraggingId}
                    currentlyDraggingId={currentlyDraggingId}
                  />
                ))}
              </div>
            ))}
            </div>
          </div>
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {draggedItem ? <DragOverlayItem content={draggedItem.content} /> : null}
      </DragOverlay>
    </DndContext>
  );
}