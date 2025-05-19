function Calendar({ schedules, onEdit, onDelete }) {
  // シンプルなリスト表示
  return (
    <div>
      <h2>予定一覧</h2>
      <ul>
        {schedules.sort((a, b) => a.date.localeCompare(b.date)).map(item => (
          <li key={item.id}>
            {item.date} {item.time} {item.title}
            <button onClick={() => onEdit(item)}>編集</button>
            <button onClick={() => onDelete(item.id)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}