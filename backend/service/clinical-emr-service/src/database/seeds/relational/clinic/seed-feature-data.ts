import { DataSource } from 'typeorm';

export interface SeededFeatureAppointment {
  sequence: number;
  appointmentId: string;
  patientId: string;
  patientAccountId: string;
  doctorId: string;
  clinicId: string;
  service: readonly [string, string, string, string, number, number, string];
  date: Date;
  time: string;
  status: string;
  createdBy?: string;
  approvedBy?: string | null;
}

export interface FeatureSeedCounts {
  reminderPreferences: number;
  statusHistory: number;
  notificationLogs: number;
  diagnosticOrders: number;
  idempotencyKeys: number;
  scheduleChanges: number;
  medicalHistory: number;
  recordVersions: number;
  treatmentHistory: number;
  dentalCharts: number;
  imageCategories: number;
  dentalImages: number;
  imageAnnotations: number;
  pacsSyncLogs: number;
  clinicalOrders: number;
  labResults: number;
  amendments: number;
  representatives: number;
  recordExports: number;
}

const IMAGE_CATEGORIES = [
  [
    'PANORAMIC',
    'Panoramic Radiographs',
    'Wide-view images of the jaws and complete dentition',
  ],
  [
    'BITEWING',
    'Bitewing Radiographs',
    'Interproximal views for detecting early decay and bone levels',
  ],
  [
    'PERIAPICAL',
    'Periapical Radiographs',
    'Detailed views of a tooth root and surrounding bone',
  ],
  [
    'CBCT',
    'Cone Beam CT Scans',
    'Three-dimensional imaging for implant and surgical planning',
  ],
  [
    'INTRAORAL',
    'Intraoral Photographs',
    'Clinical photographs used for treatment documentation',
  ],
  [
    'ORTHODONTIC',
    'Orthodontic Records',
    'Images captured for alignment and bite assessment',
  ],
] as const;

const IMAGE_ASSETS = [
  ['/images/dental/panoramic.svg', 'panoramic', 'PANORAMIC'],
  ['/images/dental/bitewing.svg', 'bitewing', 'BITEWING'],
  ['/images/dental/periapical.svg', 'periapical', 'PERIAPICAL'],
  ['/images/dental/cbct.svg', 'cbct', 'CBCT'],
  ['/images/dental/intraoral.svg', 'intraoral', 'INTRAORAL'],
  ['/images/dental/orthodontic.svg', 'orthodontic', 'ORTHODONTIC'],
] as const;

function seedUuid(prefix: string, sequence: number): string {
  return `${prefix}${'000000'}-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}

function recordId(sequence: number): string {
  return seedUuid('a4', sequence);
}

function sessionId(sequence: number): string {
  return seedUuid('e1', sequence);
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function timestampOn(date: Date, time: string): Date {
  return new Date(`${dateOnly(date)}T${time}:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function emptyCounts(): FeatureSeedCounts {
  return {
    reminderPreferences: 0,
    statusHistory: 0,
    notificationLogs: 0,
    diagnosticOrders: 0,
    idempotencyKeys: 0,
    scheduleChanges: 0,
    medicalHistory: 0,
    recordVersions: 0,
    treatmentHistory: 0,
    dentalCharts: 0,
    imageCategories: 0,
    dentalImages: 0,
    imageAnnotations: 0,
    pacsSyncLogs: 0,
    clinicalOrders: 0,
    labResults: 0,
    amendments: 0,
    representatives: 0,
    recordExports: 0,
  };
}

export async function seedClinicOperationalData(
  dataSource: DataSource,
  appointments: readonly SeededFeatureAppointment[],
  patientIds: readonly string[],
  managerIds: readonly string[],
  nurseIds: readonly string[],
): Promise<
  Pick<
    FeatureSeedCounts,
    | 'reminderPreferences'
    | 'statusHistory'
    | 'notificationLogs'
    | 'diagnosticOrders'
    | 'idempotencyKeys'
    | 'scheduleChanges'
  >
> {
  const counts = emptyCounts();

  const channels = ['APP', 'EMAIL'] as const;
  for (let patientIndex = 0; patientIndex < patientIds.length; patientIndex++) {
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
      const channel = channels[channelIndex];
      await dataSource.query(
        `INSERT INTO appointment_reminder_preferences
           (preference_id, patient_id, channel, enabled, reminder_minutes_before)
         VALUES ($1,$2,$3,TRUE,$4)
         ON CONFLICT (patient_id, channel) DO UPDATE SET
           enabled = EXCLUDED.enabled,
           reminder_minutes_before = EXCLUDED.reminder_minutes_before,
           updated_at = CURRENT_TIMESTAMP`,
        [
          seedUuid('f0', patientIndex * channels.length + channelIndex + 1),
          patientIds[patientIndex],
          channel,
          channel === 'APP' ? 1440 : 2880,
        ],
      );
      counts.reminderPreferences++;
    }
  }

  for (const appointment of appointments) {
    await dataSource.query(
      `INSERT INTO appointment_status_history
         (history_id, appointment_id, old_status, new_status, changed_by, reason)
       VALUES ($1,$2,NULL,'scheduled',$3,$4)
       ON CONFLICT (history_id) DO UPDATE SET
         appointment_id = EXCLUDED.appointment_id,
         old_status = EXCLUDED.old_status,
         new_status = EXCLUDED.new_status,
         changed_by = EXCLUDED.changed_by,
         reason = EXCLUDED.reason`,
      [
        seedUuid('f1', appointment.sequence * 2 - 1),
        appointment.appointmentId,
        appointment.createdBy ?? appointment.patientAccountId,
        'Appointment created from the clinic schedule',
      ],
    );
    counts.statusHistory++;

    if (appointment.status !== 'scheduled') {
      const changedBy =
        appointment.status === 'completed'
          ? appointment.doctorId
          : appointment.status === 'no_show'
            ? (nurseIds[(appointment.sequence - 1) % nurseIds.length] ??
              appointment.doctorId)
            : (appointment.approvedBy ??
              appointment.createdBy ??
              appointment.patientAccountId);
      const reason =
        appointment.status === 'completed'
          ? 'Clinical visit completed and record finalized'
          : appointment.status === 'confirmed'
            ? 'Appointment confirmed by the care coordination team'
            : appointment.status === 'cancelled'
              ? 'Appointment cancelled after care coordination review'
              : 'Patient attendance recorded by the clinical support team';
      await dataSource.query(
        `INSERT INTO appointment_status_history
           (history_id, appointment_id, old_status, new_status, changed_by, reason)
         VALUES ($1,$2,'scheduled',$3,$4,$5)
         ON CONFLICT (history_id) DO UPDATE SET
           appointment_id = EXCLUDED.appointment_id,
           old_status = EXCLUDED.old_status,
           new_status = EXCLUDED.new_status,
           changed_by = EXCLUDED.changed_by,
           reason = EXCLUDED.reason`,
        [
          seedUuid('f1', appointment.sequence * 2),
          appointment.appointmentId,
          appointment.status,
          changedBy,
          reason,
        ],
      );
      counts.statusHistory++;
    }

    const isFuture =
      appointment.status === 'scheduled' || appointment.status === 'confirmed';
    const channel = channels[appointment.sequence % channels.length];
    const notificationStatus = isFuture
      ? 'scheduled'
      : appointment.sequence % 11 === 0
        ? 'failed'
        : 'sent';
    const scheduledFor = timestampOn(
      addDays(appointment.date, -1),
      appointment.time,
    );
    await dataSource.query(
      `INSERT INTO appointment_notification_logs
         (log_id, appointment_id, notification_type, channel, status,
          attempt_count, notification_id, preference_enabled,
          reminder_minutes_before, last_attempt_at, next_retry_at,
          error_message, read_at, responded_at, scheduled_for)
       VALUES ($1,$2,'APPOINTMENT_REMINDER',$3,$4,$5,$6,TRUE,1440,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (log_id) DO UPDATE SET
         appointment_id = EXCLUDED.appointment_id,
         notification_type = EXCLUDED.notification_type,
         channel = EXCLUDED.channel,
         status = EXCLUDED.status,
         attempt_count = EXCLUDED.attempt_count,
         notification_id = EXCLUDED.notification_id,
         preference_enabled = EXCLUDED.preference_enabled,
         reminder_minutes_before = EXCLUDED.reminder_minutes_before,
         last_attempt_at = EXCLUDED.last_attempt_at,
         next_retry_at = EXCLUDED.next_retry_at,
         error_message = EXCLUDED.error_message,
         read_at = EXCLUDED.read_at,
         responded_at = EXCLUDED.responded_at,
         scheduled_for = EXCLUDED.scheduled_for`,
      [
        seedUuid('f2', appointment.sequence),
        appointment.appointmentId,
        channel,
        notificationStatus,
        notificationStatus === 'failed' ? 2 : 1,
        `appointment-reminder-${String(appointment.sequence).padStart(4, '0')}`,
        isFuture ? null : scheduledFor,
        notificationStatus === 'failed' ? addDays(scheduledFor, 1) : null,
        notificationStatus === 'failed'
          ? 'The delivery gateway requested a retry'
          : null,
        notificationStatus === 'sent' ? addDays(scheduledFor, 1) : null,
        notificationStatus === 'sent' && appointment.sequence % 3 === 0
          ? addDays(scheduledFor, 1)
          : null,
        scheduledFor,
      ],
    );
    counts.notificationLogs++;
  }

  const diagnosticAppointments = appointments.filter(
    (appointment) =>
      appointment.sequence % 4 === 0 || appointment.service[6] === 'imaging',
  );
  for (const appointment of diagnosticAppointments) {
    const isCompleted = appointment.status === 'completed';
    const orderType = appointment.service[0].includes('CBCT')
      ? 'cbct'
      : appointment.service[0].includes('XRAY')
        ? 'x_ray'
        : 'clinical_test';
    const orderId = seedUuid('f3', appointment.sequence);
    await dataSource.query(
      `INSERT INTO diagnostic_orders
         (order_id, appointment_id, patient_id, doctor_id, order_code,
          order_type, description, priority, tooth_number, area, status,
          result_summary, result_attachment_url, notes, ordered_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (order_id) DO UPDATE SET
         appointment_id = EXCLUDED.appointment_id,
         patient_id = EXCLUDED.patient_id,
         doctor_id = EXCLUDED.doctor_id,
         order_code = EXCLUDED.order_code,
         order_type = EXCLUDED.order_type,
         description = EXCLUDED.description,
         priority = EXCLUDED.priority,
         tooth_number = EXCLUDED.tooth_number,
         area = EXCLUDED.area,
         status = EXCLUDED.status,
         result_summary = EXCLUDED.result_summary,
         result_attachment_url = EXCLUDED.result_attachment_url,
         notes = EXCLUDED.notes,
         ordered_at = EXCLUDED.ordered_at,
         completed_at = EXCLUDED.completed_at`,
      [
        orderId,
        appointment.appointmentId,
        appointment.patientId,
        appointment.doctorId,
        `DIA-2026-${String(appointment.sequence).padStart(4, '0')}`,
        orderType,
        `Imaging review for ${appointment.service[1].toLowerCase()}`,
        appointment.sequence % 9 === 0 ? 'urgent' : 'routine',
        String(11 + (appointment.sequence % 20)),
        'Posterior dentition',
        isCompleted ? 'completed' : 'ordered',
        isCompleted
          ? 'No acute osseous finding; correlate with clinical examination'
          : null,
        isCompleted ? '/images/dental/panoramic.svg' : null,
        'Interpretation will be reviewed with the treating clinician',
        timestampOn(appointment.date, appointment.time),
        isCompleted ? timestampOn(appointment.date, appointment.time) : null,
      ],
    );
    counts.diagnosticOrders++;
  }

  const scheduleRows = (await dataSource.query(
    `SELECT schedule_id, doctor_id, work_date, shift_id
     FROM doctor_schedules
     ORDER BY work_date, schedule_id
     LIMIT 16`,
  )) as Array<{
    schedule_id: string;
    doctor_id: string;
    work_date: string;
    shift_id: string;
  }>;
  for (let index = 0; index < scheduleRows.length; index++) {
    const schedule = scheduleRows[index];
    await dataSource.query(
      `INSERT INTO schedule_changes
         (change_id, schedule_id, changed_by, change_type, old_values,
          new_values, reason, approved_by, approval_status)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)
       ON CONFLICT (change_id) DO UPDATE SET
         schedule_id = EXCLUDED.schedule_id,
         changed_by = EXCLUDED.changed_by,
         change_type = EXCLUDED.change_type,
         old_values = EXCLUDED.old_values,
         new_values = EXCLUDED.new_values,
         reason = EXCLUDED.reason,
         approved_by = EXCLUDED.approved_by,
         approval_status = EXCLUDED.approval_status`,
      [
        seedUuid('f5', index + 1),
        schedule.schedule_id,
        managerIds[index % managerIds.length],
        index % 3 === 0
          ? 'rescheduling'
          : index % 3 === 1
            ? 'shift_swap'
            : 'shift_transfer',
        JSON.stringify({
          workDate: schedule.work_date,
          shiftId: schedule.shift_id,
        }),
        JSON.stringify({
          workDate: schedule.work_date,
          shiftId: schedule.shift_id,
          roomNote: 'Updated clinical room allocation',
        }),
        'Operational coverage adjustment approved for clinic continuity',
        index % 4 === 0 ? null : managerIds[(index + 1) % managerIds.length],
        index % 4 === 0 ? 'pending' : 'approved',
      ],
    );
    counts.scheduleChanges++;
  }

  for (let index = 0; index < Math.min(appointments.length, 32); index++) {
    const appointment = appointments[index];
    const key = `appointment-seed-${String(appointment.sequence).padStart(4, '0')}`;
    await dataSource.query(
      `INSERT INTO idempotency_keys
         (idempotency_key, method, path, status, response_status, response_body, expires_at)
       VALUES ($1,'POST','/api/v1/appointments','completed',201,$2::jsonb,$3)
       ON CONFLICT (idempotency_key) DO UPDATE SET
         method = EXCLUDED.method,
         path = EXCLUDED.path,
         status = EXCLUDED.status,
         response_status = EXCLUDED.response_status,
         response_body = EXCLUDED.response_body,
         expires_at = EXCLUDED.expires_at`,
      [
        key,
        JSON.stringify({
          appointmentCode: `APT-2026-${String(appointment.sequence).padStart(4, '0')}`,
        }),
        addDays(appointment.date, 30),
      ],
    );
    counts.idempotencyKeys++;
  }

  return {
    reminderPreferences: counts.reminderPreferences,
    statusHistory: counts.statusHistory,
    notificationLogs: counts.notificationLogs,
    diagnosticOrders: counts.diagnosticOrders,
    idempotencyKeys: counts.idempotencyKeys,
    scheduleChanges: counts.scheduleChanges,
  };
}

export async function seedMedicalFeatureData(
  dataSource: DataSource,
  appointments: readonly SeededFeatureAppointment[],
  patientIds: readonly string[],
  nurseIds: readonly string[],
  adminId: string,
): Promise<
  Pick<
    FeatureSeedCounts,
    | 'medicalHistory'
    | 'recordVersions'
    | 'treatmentHistory'
    | 'dentalCharts'
    | 'imageCategories'
    | 'dentalImages'
    | 'imageAnnotations'
    | 'pacsSyncLogs'
    | 'clinicalOrders'
    | 'labResults'
    | 'amendments'
    | 'representatives'
    | 'recordExports'
  >
> {
  const counts = emptyCounts();
  const categoryIds: Record<string, string> = {};

  for (let index = 0; index < IMAGE_CATEGORIES.length; index++) {
    const [code, name, description] = IMAGE_CATEGORIES[index];
    const categoryId = seedUuid('f6', index + 1);
    categoryIds[code] = categoryId;
    await dataSource.query(
      `INSERT INTO image_categories (category_id, category_name, description)
       VALUES ($1,$2,$3)
       ON CONFLICT (category_id) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description,
         updated_at = CURRENT_TIMESTAMP`,
      [categoryId, name, description],
    );
    counts.imageCategories++;
  }

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === 'completed',
  );
  const seenPatients = new Set<string>();
  let imageSequence = 0;
  for (const appointment of completedAppointments) {
    const record = recordId(appointment.sequence);
    const session = sessionId(appointment.sequence);

    if (!seenPatients.has(appointment.patientId)) {
      seenPatients.add(appointment.patientId);
      await dataSource.query(
        `INSERT INTO medical_history
           (history_id, patient_id, condition_name, condition_type,
            diagnosed_date, treatment, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (history_id) DO UPDATE SET
           patient_id = EXCLUDED.patient_id,
           condition_name = EXCLUDED.condition_name,
           condition_type = EXCLUDED.condition_type,
           diagnosed_date = EXCLUDED.diagnosed_date,
           treatment = EXCLUDED.treatment,
           notes = EXCLUDED.notes`,
        [
          seedUuid('f7', seenPatients.size),
          appointment.patientId,
          seenPatients.size % 4 === 0
            ? 'Seasonal allergic rhinitis'
            : 'Routine dental care history',
          'medical',
          dateOnly(addDays(appointment.date, -365)),
          seenPatients.size % 4 === 0
            ? 'Uses non-sedating antihistamine as needed'
            : 'Regular preventive examinations and hygiene visits',
          'History reviewed during the dental intake process',
        ],
      );
      counts.medicalHistory++;
    }

    await dataSource.query(
      `INSERT INTO medical_record_versions
         (version_id, record_id, version_number, snapshot, changed_by, change_reason)
       VALUES ($1,$2,1,$3::jsonb,$4,$5)
       ON CONFLICT (version_id) DO UPDATE SET
         record_id = EXCLUDED.record_id,
         version_number = EXCLUDED.version_number,
         snapshot = EXCLUDED.snapshot,
         changed_by = EXCLUDED.changed_by,
         change_reason = EXCLUDED.change_reason`,
      [
        seedUuid('f8', appointment.sequence),
        record,
        JSON.stringify({
          recordCode: `MR-2026-${String(appointment.sequence).padStart(4, '0')}`,
          visitDate: dateOnly(appointment.date),
          service: appointment.service[1],
          status: 'finalized',
        }),
        appointment.doctorId,
        'Initial finalized clinical record snapshot',
      ],
    );
    counts.recordVersions++;

    await dataSource.query(
      `INSERT INTO treatment_history
         (treatment_id, record_id, patient_id, treatment_date, tooth_numbers,
          procedure_code, procedure_name, description, cost, status, performed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed',$10)
       ON CONFLICT (treatment_id) DO UPDATE SET
         record_id = EXCLUDED.record_id,
         patient_id = EXCLUDED.patient_id,
         treatment_date = EXCLUDED.treatment_date,
         tooth_numbers = EXCLUDED.tooth_numbers,
         procedure_code = EXCLUDED.procedure_code,
         procedure_name = EXCLUDED.procedure_name,
         description = EXCLUDED.description,
         cost = EXCLUDED.cost,
         status = EXCLUDED.status,
         performed_by = EXCLUDED.performed_by`,
      [
        seedUuid('f9', appointment.sequence),
        record,
        appointment.patientId,
        dateOnly(appointment.date),
        [11 + (appointment.sequence % 20)],
        appointment.service[0],
        appointment.service[1],
        `Completed ${appointment.service[1].toLowerCase()} with post-care instructions`,
        appointment.service[5],
        appointment.doctorId,
      ],
    );
    counts.treatmentHistory++;

    const toothNumbers = [
      11 + (appointment.sequence % 20),
      31 + (appointment.sequence % 10),
    ];
    for (let toothIndex = 0; toothIndex < toothNumbers.length; toothIndex++) {
      const toothNumber = toothNumbers[toothIndex];
      await dataSource.query(
        `INSERT INTO dental_charts
           (chart_id, patient_id, record_id, tooth_number, tooth_status, surfaces, notes)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)
         ON CONFLICT (chart_id) DO UPDATE SET
           patient_id = EXCLUDED.patient_id,
           record_id = EXCLUDED.record_id,
           tooth_number = EXCLUDED.tooth_number,
           tooth_status = EXCLUDED.tooth_status,
           surfaces = EXCLUDED.surfaces,
           notes = EXCLUDED.notes`,
        [
          seedUuid('fa', appointment.sequence * 2 + toothIndex),
          appointment.patientId,
          record,
          toothNumber,
          appointment.sequence % 5 === 0 ? 'restored' : 'healthy',
          JSON.stringify({
            mesial: 'intact',
            occlusal: appointment.sequence % 5 === 0 ? 'restored' : 'intact',
            distal: 'intact',
            buccal: 'intact',
            lingual: 'intact',
          }),
          'Tooth chart updated during the completed examination',
        ],
      );
      counts.dentalCharts++;
    }

    const imageCountForRecord = appointment.sequence % 3 === 0 ? 2 : 1;
    for (let imageIndex = 0; imageIndex < imageCountForRecord; imageIndex++) {
      imageSequence++;
      const asset =
        IMAGE_ASSETS[(appointment.sequence + imageIndex) % IMAGE_ASSETS.length];
      const [imageUrl, imageType, categoryCode] = asset;
      const imageId = seedUuid('fb', imageSequence);
      await dataSource.query(
        `INSERT INTO dental_images
           (image_id, patient_id, record_id, category_id, image_type,
            image_url, thumbnail_url, file_size_kb, file_format,
            tooth_numbers, view_angle, description, tags, metadata,
            pacs_id, taken_date, taken_by, uploaded_by, is_archived)
         VALUES ($1,$2,$3,$4,$5,$6,$6,184,'SVG',$7,$8,$9,$10::text[],$11::jsonb,$12,$13,$14,$15,FALSE)
         ON CONFLICT (image_id) DO UPDATE SET
           patient_id = EXCLUDED.patient_id,
           record_id = EXCLUDED.record_id,
           category_id = EXCLUDED.category_id,
           image_type = EXCLUDED.image_type,
           image_url = EXCLUDED.image_url,
           thumbnail_url = EXCLUDED.thumbnail_url,
           file_size_kb = EXCLUDED.file_size_kb,
           file_format = EXCLUDED.file_format,
           tooth_numbers = EXCLUDED.tooth_numbers,
           view_angle = EXCLUDED.view_angle,
           description = EXCLUDED.description,
           tags = EXCLUDED.tags,
           metadata = EXCLUDED.metadata,
           pacs_id = EXCLUDED.pacs_id,
           taken_date = EXCLUDED.taken_date,
           taken_by = EXCLUDED.taken_by,
           uploaded_by = EXCLUDED.uploaded_by,
           is_archived = EXCLUDED.is_archived`,
        [
          imageId,
          appointment.patientId,
          record,
          categoryIds[categoryCode],
          imageType,
          imageUrl,
          [11 + (appointment.sequence % 20)],
          imageIndex === 0 ? 'frontal' : 'occlusal',
          `${imageType[0].toUpperCase()}${imageType.slice(1)} captured for ${appointment.service[1].toLowerCase()}`,
          ['clinical-record', imageType, 'oral-health'],
          JSON.stringify({
            source: 'S.M.I.L.E imaging archive',
            reviewed: true,
          }),
          `PACS-2026-${String(imageSequence).padStart(6, '0')}`,
          dateOnly(appointment.date),
          appointment.doctorId,
          nurseIds[(imageSequence - 1) % nurseIds.length] ??
            appointment.doctorId,
        ],
      );
      counts.dentalImages++;

      await dataSource.query(
        `INSERT INTO pacs_sync_logs
           (sync_id, image_id, sync_type, pacs_server, status, error_message, synced_at)
         VALUES ($1,$2,'STORE','smile-pacs-primary',$3,$4,$5)
         ON CONFLICT (sync_id) DO UPDATE SET
           image_id = EXCLUDED.image_id,
           sync_type = EXCLUDED.sync_type,
           pacs_server = EXCLUDED.pacs_server,
           status = EXCLUDED.status,
           error_message = EXCLUDED.error_message,
           synced_at = EXCLUDED.synced_at,
           updated_at = CURRENT_TIMESTAMP`,
        [
          seedUuid('fc', imageSequence),
          imageId,
          imageSequence % 17 === 0 ? 'failed' : 'completed',
          imageSequence % 17 === 0
            ? 'The archive requested a retry during maintenance'
            : null,
          timestampOn(appointment.date, appointment.time),
        ],
      );
      counts.pacsSyncLogs++;

      if (imageSequence % 3 === 0) {
        await dataSource.query(
          `INSERT INTO image_annotations
             (annotation_id, image_id, annotated_by, annotation_type, annotation_data, note)
           VALUES ($1,$2,$3,'finding',$4::jsonb,$5)
           ON CONFLICT (annotation_id) DO UPDATE SET
             image_id = EXCLUDED.image_id,
             annotated_by = EXCLUDED.annotated_by,
             annotation_type = EXCLUDED.annotation_type,
             annotation_data = EXCLUDED.annotation_data,
             note = EXCLUDED.note,
             updated_at = CURRENT_TIMESTAMP`,
          [
            seedUuid('fd', imageSequence),
            imageId,
            appointment.doctorId,
            JSON.stringify({
              region: 'posterior dentition',
              severity: 'low',
              confidence: 0.94,
            }),
            'No urgent finding; continue the documented treatment plan',
          ],
        );
        counts.imageAnnotations++;
      }
    }
  }

  const orderCandidates = appointments.filter(
    (appointment) =>
      appointment.sequence % 7 === 0 && appointment.status === 'completed',
  );
  for (const appointment of orderCandidates) {
    const order = seedUuid('fe', appointment.sequence);
    const completedAt = timestampOn(appointment.date, appointment.time);
    const isLab = appointment.sequence % 3 === 0;
    await dataSource.query(
      `INSERT INTO clinical_orders
         (order_id, session_id, record_id, patient_id, ordered_by, order_type,
          test_type, clinical_indication, teeth_numbers, urgency, status,
          ordered_date, scheduled_date, completed_date, result_url, report)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (order_id) DO UPDATE SET
         session_id = EXCLUDED.session_id,
         record_id = EXCLUDED.record_id,
         patient_id = EXCLUDED.patient_id,
         ordered_by = EXCLUDED.ordered_by,
         order_type = EXCLUDED.order_type,
         test_type = EXCLUDED.test_type,
         clinical_indication = EXCLUDED.clinical_indication,
         teeth_numbers = EXCLUDED.teeth_numbers,
         urgency = EXCLUDED.urgency,
         status = EXCLUDED.status,
         ordered_date = EXCLUDED.ordered_date,
         scheduled_date = EXCLUDED.scheduled_date,
         completed_date = EXCLUDED.completed_date,
         result_url = EXCLUDED.result_url,
         report = EXCLUDED.report`,
      [
        order,
        sessionId(appointment.sequence),
        recordId(appointment.sequence),
        appointment.patientId,
        appointment.doctorId,
        isLab
          ? 'lab_test'
          : appointment.sequence % 2 === 0
            ? 'cbct'
            : 'clinical_test',
        isLab ? 'Complete blood count' : 'Occlusal radiograph review',
        'Additional evidence requested to complete the treatment assessment',
        [11 + (appointment.sequence % 20)],
        appointment.sequence % 9 === 0 ? 'urgent' : 'routine',
        'completed',
        completedAt,
        completedAt,
        completedAt,
        '/images/dental/panoramic.svg',
        'Findings documented in the finalized examination record',
      ],
    );
    counts.clinicalOrders++;

    if (isLab) {
      await dataSource.query(
        `INSERT INTO lab_test_results
           (result_id, order_id, test_name, result_value, result_unit,
            reference_range, is_abnormal, notes)
         VALUES ($1,$2,'Complete blood count','6.8','10^9/L','4.0-10.0',FALSE,$3)
         ON CONFLICT (result_id) DO UPDATE SET
           order_id = EXCLUDED.order_id,
           test_name = EXCLUDED.test_name,
           result_value = EXCLUDED.result_value,
           result_unit = EXCLUDED.result_unit,
           reference_range = EXCLUDED.reference_range,
           is_abnormal = EXCLUDED.is_abnormal,
           notes = EXCLUDED.notes`,
        [
          seedUuid('ff', appointment.sequence),
          order,
          'Result is within the expected reference interval',
        ],
      );
      counts.labResults++;
    }
  }

  for (
    let index = 0;
    index < Math.min(completedAppointments.length, 12);
    index++
  ) {
    const appointment = completedAppointments[index * 3];
    if (!appointment) break;
    await dataSource.query(
      `INSERT INTO examination_session_amendments
         (amendment_id, session_id, record_id, patient_id, doctor_id,
          amendment_reason, amendment_text, amended_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (amendment_id) DO UPDATE SET
         session_id = EXCLUDED.session_id,
         record_id = EXCLUDED.record_id,
         patient_id = EXCLUDED.patient_id,
         doctor_id = EXCLUDED.doctor_id,
         amendment_reason = EXCLUDED.amendment_reason,
         amendment_text = EXCLUDED.amendment_text,
         amended_by = EXCLUDED.amended_by`,
      [
        seedUuid('a0', index + 1),
        sessionId(appointment.sequence),
        recordId(appointment.sequence),
        appointment.patientId,
        appointment.doctorId,
        'Additional clinical detail recorded after chart review',
        'The treatment response was stable and the follow-up interval remains appropriate.',
        appointment.doctorId,
      ],
    );
    counts.amendments++;
  }

  const representatives = [
    ['Ava Nguyen', 'Parent', '0905001001'],
    ['Liam Tran', 'Spouse', '0905001002'],
    ['Mia Le', 'Sibling', '0905001003'],
    ['Noah Pham', 'Parent', '0905001004'],
    ['Sophia Vo', 'Spouse', '0905001005'],
    ['Ethan Bui', 'Sibling', '0905001006'],
    ['Isla Hoang', 'Parent', '0905001007'],
    ['Leo Do', 'Spouse', '0905001008'],
  ] as const;
  for (let index = 0; index < representatives.length; index++) {
    const patientId = patientIds[index * 4];
    if (!patientId) break;
    const [fullName, relationship, phone] = representatives[index];
    await dataSource.query(
      `INSERT INTO patient_representatives
         (representative_id, patient_id, full_name, relationship, phone, email,
          legal_document_type, legal_document_number, is_primary, is_active,
          authorized_for_treatment, authorized_for_payment, authorized_for_records,
          verified_at, verified_by)
       VALUES ($1,$2,$3,$4,$5,$6,'CITIZEN_ID',$7,TRUE,TRUE,TRUE,TRUE,TRUE,$8,$9)
       ON CONFLICT (representative_id) DO UPDATE SET
         patient_id = EXCLUDED.patient_id,
         full_name = EXCLUDED.full_name,
         relationship = EXCLUDED.relationship,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         legal_document_type = EXCLUDED.legal_document_type,
         legal_document_number = EXCLUDED.legal_document_number,
         is_primary = EXCLUDED.is_primary,
         is_active = EXCLUDED.is_active,
         authorized_for_treatment = EXCLUDED.authorized_for_treatment,
         authorized_for_payment = EXCLUDED.authorized_for_payment,
         authorized_for_records = EXCLUDED.authorized_for_records,
         verified_at = EXCLUDED.verified_at,
         verified_by = EXCLUDED.verified_by`,
      [
        seedUuid('a1', index + 1),
        patientId,
        fullName,
        relationship,
        phone,
        `family.contact${index + 1}@smile.com`,
        `REP-2026-${String(index + 1).padStart(4, '0')}`,
        new Date('2026-06-15T09:00:00.000Z'),
        adminId,
      ],
    );
    counts.representatives++;
  }

  for (let index = 0; index < completedAppointments.length; index += 10) {
    const appointment = completedAppointments[index];
    await dataSource.query(
      `INSERT INTO record_exports
         (export_id, patient_id, record_id, export_type, export_format,
          file_url, exported_by, expires_at)
       VALUES ($1,$2,$3,'patient_record','PDF',$4,$5,$6)
       ON CONFLICT (export_id) DO UPDATE SET
         patient_id = EXCLUDED.patient_id,
         record_id = EXCLUDED.record_id,
         export_type = EXCLUDED.export_type,
         export_format = EXCLUDED.export_format,
         file_url = EXCLUDED.file_url,
         exported_by = EXCLUDED.exported_by,
         expires_at = EXCLUDED.expires_at`,
      [
        seedUuid('a2', index + 1),
        appointment.patientId,
        recordId(appointment.sequence),
        `/exports/medical-record-${String(appointment.sequence).padStart(4, '0')}.pdf`,
        appointment.patientAccountId,
        addDays(appointment.date, 90),
      ],
    );
    counts.recordExports++;
  }

  return {
    medicalHistory: counts.medicalHistory,
    recordVersions: counts.recordVersions,
    treatmentHistory: counts.treatmentHistory,
    dentalCharts: counts.dentalCharts,
    imageCategories: counts.imageCategories,
    dentalImages: counts.dentalImages,
    imageAnnotations: counts.imageAnnotations,
    pacsSyncLogs: counts.pacsSyncLogs,
    clinicalOrders: counts.clinicalOrders,
    labResults: counts.labResults,
    amendments: counts.amendments,
    representatives: counts.representatives,
    recordExports: counts.recordExports,
  };
}
