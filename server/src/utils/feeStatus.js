/** Compute fee status from due date and payment */
export function computeFeeStatus(fee) {
  if (fee.paidDate) return 'paid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(fee.dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 5) return 'due_soon';
  return 'pending';
}

export async function refreshFeeStatus(Fee, feeId) {
  const fee = await Fee.findById(feeId);
  if (!fee) return null;
  fee.status = computeFeeStatus(fee);
  await fee.save();
  return fee;
}

export async function refreshAllFeeStatuses(Fee) {
  const fees = await Fee.find({ paidDate: null });
  for (const fee of fees) {
    fee.status = computeFeeStatus(fee);
    await fee.save();
  }
}
