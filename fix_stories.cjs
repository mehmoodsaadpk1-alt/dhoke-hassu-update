const fs = require('fs');
const file = 'src/components/AppShell.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  // Remove renderAddStoryModal and renderStoryViewerModal (lines 3155 to 3552, i.e., index 3154 to 3551)
  if (i >= 3154 && i <= 3551) {
    if (i === 3154) {
      newLines.push('  // Legacy story modals removed');
    }
    continue;
  }
  
  // Replace the modal invocations at line 5744 and 5745 (index 5743 and 5744 in original lines)
  if (i === 5743) {
    newLines.push(`      {showAddStoryModal && (
        <StoryCreator
          user={{
            id: user.id || '',
            name: profileData?.full_name || user.email || 'User',
            email: user.email || '',
            avatar: profileData?.profile_photo || ''
          }}
          isEn={currentLanguage === 'en'}
          onClose={() => setShowAddStoryModal(false)}
          onComplete={async (createdStory) => {
            setShowAddStoryModal(false);
            setStories(prev => [createdStory, ...prev]);
          }}
        />
      )}
      {viewingStoryIdx !== null && (
        <StoryViewer
          stories={stories}
          initialIdx={viewingStoryIdx}
          onClose={() => setViewingStoryIdx(null)}
          viewerId={user.id || ''}
        />
      )}`);
    // Skip original 5743 and 5744
    i++; 
    continue;
  }

  newLines.push(lines[i]);
}

fs.writeFileSync(file, newLines.join('\n'));
console.log('AppShell.tsx updated successfully');
