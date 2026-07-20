const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SearchModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import dbSearchUsers
if (!content.includes('dbSearchUsers')) {
  content = content.replace(
    "dbGetActiveAds",
    "dbGetActiveAds,\n  dbSearchUsers"
  );
}

// 2. Add State and useEffect
const searchStateOld = "  const [query, setQuery] = useState(initialQuery || '');";
const searchStateNew = `  const [query, setQuery] = useState(initialQuery || '');
  const [realUsers, setRealUsers] = useState<any[]>([]);

  useEffect(() => {
    if (currentPath === '/search/results' && query?.trim().length > 1) {
      setIsLoading(true);
      dbSearchUsers(query).then(users => {
        setRealUsers(users);
        setIsLoading(false);
      });
    }
  }, [currentPath, query]);
`;
if (!content.includes('const [realUsers')) {
  content = content.replace(searchStateOld, searchStateNew);
}

// 3. Update allUsers definition
const allUsersOld = "const allUsers = [...MOCK_USERS_DATA, currentUser];";
const allUsersNew = "const allUsers = [...realUsers, currentUser];";
if (content.includes(allUsersOld)) {
  content = content.replace(allUsersOld, allUsersNew);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patched SearchModule.tsx to fetch real users');
