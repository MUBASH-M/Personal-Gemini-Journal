export function getMoodDetails(mood: string): {
  label: string;
  badgeClass: string;
  bgClass: string;
  borderClass: string;
  dotColor: string;
} {
  const m = (mood || '').toLowerCase();
  switch (m) {
    case 'calm':
      return {
        label: 'Calm',
        badgeClass: 'bg-[#F0F4F1] text-[#243E2C] border-[#243E2C]/20',
        bgClass: 'bg-[#F5F8F6]',
        borderClass: 'border-[#243E2C]/20',
        dotColor: '#36533D',
      };
    case 'reflective':
      return {
        label: 'Reflective',
        badgeClass: 'bg-[#EFECE6] text-[#1A1A1A] border-[#1A1A1A]/20',
        bgClass: 'bg-[#F7F5F0]',
        borderClass: 'border-[#1A1A1A]/20',
        dotColor: '#1A1A1A',
      };
    case 'excited':
      return {
        label: 'Excited',
        badgeClass: 'bg-[#FAF0E6] text-[#783E19] border-[#783E19]/20',
        bgClass: 'bg-[#FCF6EE]',
        borderClass: 'border-[#783E19]/20',
        dotColor: '#A0522D',
      };
    case 'creative':
      return {
        label: 'Creative',
        badgeClass: 'bg-[#F4EFF7] text-[#4A2D5C] border-[#4A2D5C]/20',
        bgClass: 'bg-[#FAF6FC]',
        borderClass: 'border-[#4A2D5C]/20',
        dotColor: '#5C3872',
      };
    case 'optimistic':
      return {
        label: 'Optimistic',
        badgeClass: 'bg-[#EDF5F2] text-[#1E4D3E] border-[#1E4D3E]/20',
        bgClass: 'bg-[#F4F9F6]',
        borderClass: 'border-[#1E4D3E]/20',
        dotColor: '#2B6A56',
      };
    case 'grateful':
      return {
        label: 'Grateful',
        badgeClass: 'bg-[#F9ECEB] text-[#6E2B29] border-[#6E2B29]/20',
        bgClass: 'bg-[#FCF4F3]',
        borderClass: 'border-[#6E2B29]/20',
        dotColor: '#8C3532',
      };
    case 'stressed':
      return {
        label: 'Stressed',
        badgeClass: 'bg-[#F7EFE8] text-[#6E421E] border-[#6E421E]/20',
        bgClass: 'bg-[#FAF4EE]',
        borderClass: 'border-[#6E421E]/20',
        dotColor: '#8E5528',
      };
    case 'anxious':
      return {
        label: 'Anxious',
        badgeClass: 'bg-[#F8EDED] text-[#7A2828] border-[#7A2828]/20',
        bgClass: 'bg-[#FAF3F3]',
        borderClass: 'border-[#7A2828]/20',
        dotColor: '#9C3434',
      };
    case 'overwhelmed':
      return {
        label: 'Overwhelmed',
        badgeClass: 'bg-[#F0EEF5] text-[#403859] border-[#403859]/20',
        bgClass: 'bg-[#F6F4FA]',
        borderClass: 'border-[#403859]/20',
        dotColor: '#534B6E',
      };
    default:
      return {
        label: mood || 'Reflective',
        badgeClass: 'bg-[#EFECE6] text-[#1A1A1A] border-[#1A1A1A]/20',
        bgClass: 'bg-[#F9F8F6]',
        borderClass: 'border-[#1A1A1A]/15',
        dotColor: '#1A1A1A',
      };
  }
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
