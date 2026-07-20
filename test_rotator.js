// Test script
const placementAds = [{id: 'A'}, {id: 'B'}, {id: 'C'}];
const assignmentsRef = { current: {} };
let initialCursorRef = { current: 0 };
let currentCursor = initialCursorRef.current;
let newAssignmentsAdded = false;
let itemCount = 200;
let interval = 5;

for (let i = 0; i < itemCount; i++) {
  if ((i + 1) % interval === 0) {
    if (!assignmentsRef.current[i]) {
      const checkIndex = currentCursor % placementAds.length;
      const selectedAd = placementAds[checkIndex];
      
      assignmentsRef.current[i] = selectedAd;
      newAssignmentsAdded = true;

      const nextCursor = (currentCursor + 1) % placementAds.length;
      currentCursor = nextCursor;
    }
  }
}

if (newAssignmentsAdded) {
  initialCursorRef.current = currentCursor;
}

console.log(assignmentsRef.current);
console.log("Next cursor:", currentCursor);
