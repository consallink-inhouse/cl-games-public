function ScheduleForm({ onSubmit, editing, onCancel }) {
  const [title, setTitle] = React.useState(editing ? editing.title : '');
  const [date, setDate] = React.useState(editing ? editing.date : '');
  const [time, setTime] = React.useState(editing ? editing.time : '');

  React.useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDate(editing.date);
      setTime(editing.time);
    }
  }, [editing]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title || !date) return;
    onSubmit({
      id: editing ? editing.id : Date.now(),
      title,
      date,
      time
    });
    setTitle('');
    setDate('');
    setTime('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="タイトル"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
      />
      <button type="submit">{editing ? "更新" : "追加"}</button>
      {editing && <button type="button" onClick={onCancel}>キャンセル</button>}
    </form>
  );
}