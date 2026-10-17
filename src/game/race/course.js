// Each player gets the SAME authored track, but never shared mutable triggers.
export default function createRaceCourse(level) {
  const course = { ...level, items: level.items.map((item) => ({ ...item })) };
  const passive = new Set(['plat', 'vanish', 'zone', 'portal', 'speed', 'gem']);
  return { course, hazards: course.items.filter((item) => !passive.has(item.type)),
    solids: course.items.filter((item) => item.type === 'plat' || item.type === 'vanish') };
}