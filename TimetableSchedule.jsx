import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Clock, MapPin, Calendar, User, BookOpen } from 'lucide-react';

export default function TimetableSchedule() {
  const [scheduleByDay, setScheduleByDay] = useState({});
  const [activeDay, setActiveDay] = useState('Monday');
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    async function loadTimetable() {
      try {
        const res = await api.getTimetable({ semester: 5 });
        setScheduleByDay(res.scheduleByDay || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTimetable();
  }, []);

  const activeSlots = scheduleByDay[activeDay] || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Department Schedule
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Weekly Class Timetable
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Odd Semester 2026 • Computer Science & Engineering (Semester 5, Section A)
          </p>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map((day) => {
          const isActive = activeDay === day;
          const count = (scheduleByDay[day] || []).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-campus-primary text-white shadow-card'
                  : 'bg-white text-campus-text hover:bg-campus-secondary/40 border border-campus-secondary'
              }`}
            >
              <span>{day}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-campus-secondary text-campus-primary'}`}>
                {count} {count === 1 ? 'class' : 'classes'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Class Schedule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeSlots.map((slot, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary flex flex-col justify-between hover:border-campus-primary/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-extrabold text-campus-primary bg-campus-secondary px-3 py-1 rounded-full">
                  {slot.course_code}
                </span>
                <span className="text-xs font-bold text-campus-text flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-campus-primary" />
                  {slot.start_time} - {slot.end_time}
                </span>
              </div>

              <h4 className="font-extrabold text-base text-campus-text">{slot.course_name}</h4>

              <div className="mt-4 space-y-2 text-xs text-campus-muted">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-campus-primary" />
                  <span>Instructor: <span className="font-semibold text-campus-text">{slot.faculty_name || 'Prof. Alan Turing'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-campus-primary" />
                  <span>Location: <span className="font-semibold text-campus-text">{slot.room}</span></span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-campus-secondary/60 flex items-center justify-between text-[11px] text-campus-muted">
              <span>Section A</span>
              <span className="font-semibold text-campus-success">In-Person Lecture</span>
            </div>
          </div>
        ))}

        {activeSlots.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center shadow-card border border-campus-secondary">
            <Calendar className="w-12 h-12 text-campus-muted mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-base text-campus-text">No Lectures Scheduled</h4>
            <p className="text-xs text-campus-muted mt-1">There are no academic sessions registered for {activeDay}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
