import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { App, Button, DatePicker, Switch, Table, Tag, Tooltip } from 'antd';
import { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useGetPatientSummary,
  useGetPatientBoltonAnalysis,
  usePutPatientToothMeasurements,
  useListToothMeasurements,
  getGetPatientSummaryQueryKey,
  getGetPatientBoltonAnalysisQueryKey,
  getListToothMeasurementsQueryKey,
} from '../../../api/generated/clinical/clinical';
import type {
  BoltonRatio,
  ToothMeasurement,
  ToothMeasurementBatchTeethItem,
  ValidationErrorResponse,
} from '../../../api/generated/model';
import { userStorage } from '../../../api/token-storage';
import '../patient-edit.css';

const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const DECIDUOUS_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DECIDUOUS_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

function validateWidth(raw: string): string | null {
  const v = raw.trim();
  if (v === '') return null;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) return 'Invalid number';
  const n = Number(v);
  if (n < 1 || n > 30) return '1.00–30.00 mm';
  return null;
}

export function ToothMeasurementsTab({ patientId }: { patientId: number }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const currentUserId = userStorage.get()?.id;

  const [sessionDate, setSessionDate] = useState<Dayjs>(dayjs());
  const [values, setValues] = useState<Record<number, string>>({});
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [showDeciduous, setShowDeciduous] = useState(false);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());

  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const summaryKey = getGetPatientSummaryQueryKey(patientId);
  const { data: summary } = useGetPatientSummary(patientId);
  const latestByTooth = useMemo(() => {
    const map = new Map<number, ToothMeasurement>();
    (summary?.tooth_measurements ?? []).forEach((m) => map.set(m.tooth_number, m));
    return map;
  }, [summary]);

  const boltonKey = getGetPatientBoltonAnalysisQueryKey(patientId);
  const { data: bolton } = useGetPatientBoltonAnalysis(patientId);

  const historyKey = getListToothMeasurementsQueryKey({ patient_id: patientId, per_page: 100 });
  const { data: history, isLoading: historyLoading } = useListToothMeasurements({
    patient_id: patientId,
    per_page: 100,
  });

  const allRecords = useMemo(() => history?.data ?? [], [history]);

  const sessions = useMemo(() => {
    const byDate = new Map<string, ToothMeasurement[]>();
    allRecords.forEach((r) => {
      const list = byDate.get(r.measured_at) ?? [];
      list.push(r);
      byDate.set(r.measured_at, list);
    });
    return Array.from(byDate.entries())
      .map(([date, teeth]) => ({ date, teeth, measuredBy: teeth[0]?.measured_by }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allRecords]);

  // Load the selected session's teeth (if any) whenever the date or history changes.
  useEffect(() => {
    const dateStr = sessionDate.format('YYYY-MM-DD');
    const existing = allRecords.filter((r) => r.measured_at === dateStr);
    const nextValues: Record<number, string> = {};
    const nextTouched = new Set<number>();
    existing.forEach((r) => {
      nextValues[r.tooth_number] = r.mesiodistal_width_mm ?? '';
      nextTouched.add(r.tooth_number);
    });
    setValues(nextValues);
    setTouched(nextTouched);
    setErrors({});
  }, [sessionDate, allRecords]);

  const chartingOrder = useMemo(
    () => [
      ...PERMANENT_UPPER,
      ...PERMANENT_LOWER,
      ...(showDeciduous ? [...DECIDUOUS_UPPER, ...DECIDUOUS_LOWER] : []),
    ],
    [showDeciduous],
  );

  const buildPayloadTeeth = (): ToothMeasurementBatchTeethItem[] =>
    Array.from(touched).map((tooth) => {
      const raw = (values[tooth] ?? '').trim();
      return { tooth_number: tooth, mesiodistal_width_mm: raw === '' ? undefined : raw };
    });

  const { mutate: save, isPending: isSaving } = usePutPatientToothMeasurements({
    mutation: {
      onSuccess: (res) => {
        message.success('Charting session saved');
        const nextValues: Record<number, string> = {};
        const nextTouched = new Set<number>();
        res.data.forEach((r) => {
          nextValues[r.tooth_number] = r.mesiodistal_width_mm ?? '';
          nextTouched.add(r.tooth_number);
        });
        setValues(nextValues);
        setTouched(nextTouched);
        setErrors({});
        queryClient.invalidateQueries({ queryKey: summaryKey });
        queryClient.invalidateQueries({ queryKey: boltonKey });
        queryClient.invalidateQueries({ queryKey: historyKey });
      },
      onError: (error) => {
        const r = (error as unknown as AxiosError<ValidationErrorResponse>).response;
        if (r?.status === 422 && r.data?.errors) {
          const submitted = buildPayloadTeeth();
          const nextErrors: Record<number, string> = {};
          Object.entries(r.data.errors).forEach(([key, msgs]) => {
            const m = key.match(/^teeth\.(\d+)\./);
            if (m) {
              const tooth = submitted[Number(m[1])]?.tooth_number;
              if (tooth) nextErrors[tooth] = msgs[0];
            }
          });
          setErrors((prev) => ({ ...prev, ...nextErrors }));
          message.error('Some measurements were rejected — check the highlighted teeth');
        } else {
          message.error('Could not save charting session');
        }
      },
    },
  });

  const hasClientErrors = Object.keys(errors).length > 0;

  const onCellChange = (tooth: number, raw: string) => {
    setValues((v) => ({ ...v, [tooth]: raw }));
    setTouched((t) => new Set(t).add(tooth));
    setErrors((e) => {
      const next = { ...e };
      const err = validateWidth(raw);
      if (err) next[tooth] = err;
      else delete next[tooth];
      return next;
    });
  };

  const onCellKeyDown = (tooth: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const idx = chartingOrder.indexOf(tooth);
    const next = chartingOrder[idx + 1];
    if (next != null) inputRefs.current.get(next)?.focus();
  };

  const onSave = () => {
    const teeth = buildPayloadTeeth();
    if (teeth.length === 0) {
      message.info('Enter at least one tooth width before saving.');
      return;
    }
    save({ id: patientId, data: { measured_at: sessionDate.format('YYYY-MM-DD'), teeth } });
  };

  const renderTooth = (tooth: number) => {
    const err = errors[tooth];
    const isTouched = touched.has(tooth);
    const latest = latestByTooth.get(tooth);
    const isHighlighted = highlighted.has(tooth);
    const displayValue = isTouched ? values[tooth] ?? '' : '';
    const placeholder = !isTouched && latest?.mesiodistal_width_mm ? latest.mesiodistal_width_mm : '—';

    return (
      <div
        key={tooth}
        className={[
          'tooth-cell',
          isTouched && 'tooth-cell--touched',
          err && 'tooth-cell--error',
          isHighlighted && 'tooth-cell--highlight',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="tooth-cell__label">{tooth}</span>
        <input
          ref={(el) => {
            if (el) inputRefs.current.set(tooth, el);
            else inputRefs.current.delete(tooth);
          }}
          className="tooth-cell__input"
          value={displayValue}
          placeholder={placeholder}
          inputMode="decimal"
          onChange={(e) => onCellChange(tooth, e.target.value)}
          onKeyDown={(e) => onCellKeyDown(tooth, e)}
        />
        {!isTouched && latest?.measured_at && <span className="tooth-cell__hint">{latest.measured_at}</span>}
        {err && <span className="tooth-cell__error">{err}</span>}
      </div>
    );
  };

  const renderArch = (teeth: number[], midpoint: number) => (
    <div className="odontogram-arch">
      {teeth.map((t, i) => (
        <Fragment key={t}>
          {i === midpoint && <div className="odontogram-arch__gap" />}
          {renderTooth(t)}
        </Fragment>
      ))}
    </div>
  );

  const boltonDeviation = (ratio: BoltonRatio) => {
    if (ratio.ratio_percent == null) return null;
    const diff = Number(ratio.ratio_percent) - Number(ratio.ideal_percent);
    if (Math.abs(diff) <= 2) return { cls: 'neutral', text: 'Within ideal range', tip: 'Ratio is close to the Bolton ideal.' };
    if (diff > 0) return { cls: 'mandibular', text: 'Mandibular excess', tip: 'Lower arch tooth width is proportionally larger than ideal.' };
    return { cls: 'maxillary', text: 'Maxillary excess', tip: 'Upper arch tooth width is proportionally larger than ideal.' };
  };

  const renderBoltonRow = (title: string, ratio?: BoltonRatio) => {
    if (!ratio) return null;
    const badge = boltonDeviation(ratio);
    return (
      <div className="bolton-row" key={title}>
        <div className="bolton-row__head">
          <span className="bolton-row__title">{title}</span>
          <span className="bolton-row__ideal">Ideal {ratio.ideal_percent}%</span>
        </div>
        {ratio.ratio_percent != null ? (
          <>
            <div className="bolton-row__value">{ratio.ratio_percent}%</div>
            {badge && (
              <Tooltip title={badge.tip}>
                <span className={`bolton-badge bolton-badge--${badge.cls}`}>{badge.text}</span>
              </Tooltip>
            )}
          </>
        ) : (
          <>
            <div className="bolton-missing">{ratio.missing_teeth.length} teeth unmeasured</div>
            <div>
              {ratio.missing_teeth.map((t) => (
                <span
                  key={t}
                  className="bolton-chip"
                  onMouseEnter={() => setHighlighted(new Set(ratio.missing_teeth))}
                  onMouseLeave={() => setHighlighted(new Set())}
                >
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="patient-profile-form">
      <div className="profile-layout profile-layout--tooth">
        <div className="profile-column">
          <h3 className="profile-column__title">Odontogram</h3>

          <div className="odontogram-toolbar">
            <span className="odontogram-toolbar__label">Session date</span>
            <DatePicker
              value={sessionDate}
              onChange={(d) => d && setSessionDate(d)}
              disabledDate={(d) => d.isAfter(dayjs(), 'day')}
              allowClear={false}
              format="YYYY-MM-DD"
            />
            <span className="odontogram-toolbar__label">Show deciduous teeth</span>
            <Switch checked={showDeciduous} onChange={setShowDeciduous} />
          </div>

          {renderArch(PERMANENT_UPPER, 8)}
          {renderArch(PERMANENT_LOWER, 8)}

          {showDeciduous && (
            <>
              {renderArch(DECIDUOUS_UPPER, 5)}
              {renderArch(DECIDUOUS_LOWER, 5)}
            </>
          )}

          <div className="profile-actions" style={{ marginTop: 20 }}>
            <Button
              type="primary"
              loading={isSaving}
              disabled={hasClientErrors}
              onClick={onSave}
            >
              Save changes
            </Button>
          </div>
        </div>

        <div className="profile-column">
          <h3 className="profile-column__title">Bolton Analysis</h3>
          {renderBoltonRow('Anterior', bolton?.anterior)}
          {renderBoltonRow('Overall', bolton?.overall)}
        </div>
      </div>

      <div className="profile-column" style={{ marginTop: 24 }}>
        <h3 className="profile-column__title">Measurement History</h3>
        <Table
          rowKey="date"
          loading={historyLoading}
          dataSource={sessions}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'Date', dataIndex: 'date' },
            {
              title: 'Teeth measured',
              render: (_, s) => `${s.teeth.filter((t) => t.mesiodistal_width_mm).length} / ${s.teeth.length}`,
            },
            {
              title: 'Measured by',
              render: (_, s) =>
                s.measuredBy == null ? '—' : s.measuredBy === currentUserId ? 'You' : `User #${s.measuredBy}`,
            },
          ]}
          expandable={{
            expandedRowRender: (s) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[...s.teeth]
                  .sort((a, b) => a.tooth_number - b.tooth_number)
                  .map((t) => (
                    <Tag key={t.tooth_number}>
                      {t.tooth_number}: {t.mesiodistal_width_mm ?? '—'} mm
                    </Tag>
                  ))}
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}
