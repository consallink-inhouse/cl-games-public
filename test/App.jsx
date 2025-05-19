const { useState, useEffect } = React;

function loadSchedules() {
  return JSON.parse(localStorage.getItem('schedules') || '[]');
}
function saveSchedules(schedules) {
  localStorage.setItem('schedules', JSON.stringify(schedules));
}

function App() {
  const [schedules, setSchedules] = useState(loadSchedules());
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    saveSchedules(schedules);
  }, [schedules]);

  function addSchedule(item) {
    setSchedules([...schedules, item]);
  }

  function updateSchedule(updated) {
    setSchedules(schedules.map(s => s.id === updated.id ? updated : s));
    setEditing(null);
  }

  function deleteSchedule(id) {
    setSchedules(schedules.filter(s => s.id !== id));
  }

  return (
    <div>
      <h1>スケジュール管理アプリ</h1>
      <ScheduleForm
        onSubmit={editing ? updateSchedule : addSchedule}
        editing={editing}
        onCancel={() => setEditing(null)}
      />
      <Calendar
        schedules={schedules}
        onEdit={setEditing}
        onDelete={deleteSchedule}
      />
    </div>
  );
}

// ScheduleFormとCalendarコンポーネントは後述します