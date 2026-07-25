import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DoctorLeavesService } from './doctor-leaves.service';
import { ApprovalStatus } from '../utils/enums/approval-status.enum';
import { LeaveType } from '../utils/enums/leave-type.enum';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('DoctorLeavesService', () => {
  const leaveId = '11111111-1111-4111-8111-111111111111';
  const doctorId = '22222222-2222-4222-8222-222222222222';
  const approverId = '33333333-3333-4333-8333-333333333333';

  function createService() {
    const leaveRepository = createRepositoryMock();
    const service = new DoctorLeavesService(leaveRepository as any);

    leaveRepository.findOne.mockResolvedValue(null);

    return { service, leaveRepository };
  }

  function createLeave(overrides = {}) {
    return {
      doctor_id: doctorId,
      leave_type: LeaveType.ANNUAL,
      start_date: '2026-07-10',
      end_date: '2026-07-12',
      reason: 'Family leave',
      ...overrides,
    };
  }

  it('should reject leave requests when end date is before start date', async () => {
    const { service, leaveRepository } = createService();

    await expect(
      service.create(
        createLeave({
          start_date: '2026-07-12',
          end_date: '2026-07-10',
        }),
      ),
    ).rejects.toThrow(BadRequestException);

    expect(leaveRepository.save).not.toHaveBeenCalled();
  });

  it('should reject overlapping pending or approved leave requests for the same doctor', async () => {
    const { service, leaveRepository } = createService();
    leaveRepository.findOne.mockResolvedValue({
      leave_id: leaveId,
      doctor_id: doctorId,
      status: ApprovalStatus.PENDING,
    });

    await expect(service.create(createLeave())).rejects.toThrow(
      ConflictException,
    );

    expect(leaveRepository.save).not.toHaveBeenCalled();
  });

  it('should create a leave request as pending when dates do not overlap', async () => {
    const { service, leaveRepository } = createService();

    const result = await service.create(createLeave());

    expect(result).toEqual(
      expect.objectContaining({
        doctor_id: doctorId,
        status: ApprovalStatus.PENDING,
      }),
    );
    expect(leaveRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        doctor_id: doctorId,
        status: ApprovalStatus.PENDING,
      }),
    );
  });

  it('should require an approver when approving or rejecting a leave request', async () => {
    const { service, leaveRepository } = createService();
    leaveRepository.findOne.mockResolvedValue({
      leave_id: leaveId,
      doctor_id: doctorId,
      status: ApprovalStatus.PENDING,
      approved_by: null,
    });

    await expect(
      service.update(leaveId, { status: ApprovalStatus.APPROVED }),
    ).rejects.toThrow(BadRequestException);

    expect(leaveRepository.save).not.toHaveBeenCalled();
  });

  it('should reject updating a leave request after it is approved', async () => {
    const { service, leaveRepository } = createService();
    leaveRepository.findOne.mockResolvedValue({
      leave_id: leaveId,
      doctor_id: doctorId,
      status: ApprovalStatus.APPROVED,
      approved_by: approverId,
    });

    await expect(
      service.update(leaveId, { reason: 'Changed reason' }),
    ).rejects.toThrow(ConflictException);

    expect(leaveRepository.save).not.toHaveBeenCalled();
  });

  it('should update a pending leave request with approval metadata', async () => {
    const { service, leaveRepository } = createService();
    leaveRepository.findOne.mockResolvedValue({
      leave_id: leaveId,
      doctor_id: doctorId,
      status: ApprovalStatus.PENDING,
      approved_by: null,
    });

    const result = await service.update(leaveId, {
      status: ApprovalStatus.APPROVED,
      approved_by: approverId,
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: ApprovalStatus.APPROVED,
        approved_by: approverId,
      }),
    );
    expect(leaveRepository.save).toHaveBeenCalled();
  });

  it('should reject deleting a leave request after it is rejected', async () => {
    const { service, leaveRepository } = createService();
    leaveRepository.findOne.mockResolvedValue({
      leave_id: leaveId,
      doctor_id: doctorId,
      status: ApprovalStatus.REJECTED,
    });

    await expect(service.remove(leaveId)).rejects.toThrow(ConflictException);

    expect(leaveRepository.remove).not.toHaveBeenCalled();
  });

  it('should throw not found when updating a missing leave request', async () => {
    const { service } = createService();

    await expect(
      service.update(leaveId, {
        status: ApprovalStatus.APPROVED,
        approved_by: approverId,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
