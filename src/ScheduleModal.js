import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * ScheduleModal
 *
 * Props:
 *   mode     : 'new' | 'view'  （view は内部で edit に遷移可能）
 *   dateKey  : 'YYYY-MM-DD'    （新規登録時の開始日）
 *   schedule : object | null   （閲覧・編集時の既存データ。id を含む）
 *   onClose  : () => void
 *   onSaved  : () => void      （保存・削除完了後にカレンダーを再取得させる）
 */
function ScheduleModal({ mode: initialMode, dateKey, schedule, onClose, onSaved }) {
  // 内部モード管理（view → edit に昇格できる）
  const [mode, setMode] = useState(initialMode);

  // フォーム値（新規は空、閲覧/編集は既存値で初期化）
  const [startTime, setStartTime] = useState(schedule?.start_time ?? '');
  const [endDate,   setEndDate]   = useState(schedule?.end_date   ?? dateKey);
  const [endTime,   setEndTime]   = useState(schedule?.end_time   ?? '');
  const [title,     setTitle]     = useState(schedule?.title      ?? '');
  const [detail,    setDetail]    = useState(schedule?.detail     ?? '');

  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isNew  = mode === 'new';

  // 開始日（新規はdateKey、閲覧・編集は既存のstart_date）
  const startDate = isNew ? dateKey : (schedule?.start_date ?? dateKey);

  // ---- 保存（新規 or 編集） ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('見出しは必須です。');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await addDoc(collection(db, 'schedules'), {
          start_date: startDate,
          start_time: startTime,
          end_date:   endDate,
          end_time:   endTime,
          title:      title.trim(),
          detail:     detail,
        });
      } else {
        // edit
        await updateDoc(doc(db, 'schedules', schedule.id), {
          start_time: startTime,
          end_date:   endDate,
          end_time:   endTime,
          title:      title.trim(),
          detail:     detail,
        });
      }
      onSaved();
    } catch (err) {
      console.error('Firestore保存エラー:', err);
      setError('保存に失敗しました。再度お試しください。');
      setSaving(false);
    }
  };

  // ---- 削除 ----
  const handleDelete = async () => {
    if (!window.confirm(`「${schedule.title}」を削除しますか？`)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteDoc(doc(db, 'schedules', schedule.id));
      onSaved();
    } catch (err) {
      console.error('Firestore削除エラー:', err);
      setError('削除に失敗しました。再度お試しください。');
      setDeleting(false);
    }
  };

  // ---- オーバーレイクリックで閉じる ----
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ---- タイトル文字列 ----
  const modalTitle = isNew ? '予定を登録' : isEdit ? '予定を編集' : '予定の詳細';

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* ヘッダー */}
        <div className="modal-header">
          <h2 id="modal-title">{modalTitle}</h2>
          <button className="modal-close" onClick={onClose} aria-label="閉じる">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* 日付・時間（1行） */}
          <div className="form-row">
            <label>日付</label>
            <div className="date-range-row">
              {/* 開始日（常に編集不可） */}
              <input type="text" value={startDate} readOnly className="input-readonly input-date" />
              {/* 開始時間 */}
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                readOnly={isView}
                className={`input-time${isView ? ' input-readonly' : ''}`}
              />
              <span className="date-range-sep">〜</span>
              {/* 終了日 */}
              <input
                id="end-date"
                type={isView ? 'text' : 'date'}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                readOnly={isView}
                className={`input-date${isView ? ' input-readonly' : ''}`}
              />
              {/* 終了時間 */}
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                readOnly={isView}
                className={`input-time${isView ? ' input-readonly' : ''}`}
              />
            </div>
          </div>

          {/* 見出し */}
          <div className="form-row">
            <label htmlFor="modal-title-input">
              見出し {!isView && <span className="required">*</span>}
            </label>
            <input
              id="modal-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isView ? '' : '見出しを入力'}
              readOnly={isView}
              className={isView ? 'input-readonly' : ''}
              required={!isView}
            />
          </div>

          {/* 詳細 */}
          <div className="form-row">
            <label htmlFor="detail">詳細</label>
            <textarea
              id="detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={isView ? '' : '詳細を入力'}
              rows={4}
              readOnly={isView}
              className={isView ? 'input-readonly' : ''}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          {/* ボタン群 */}
          <div className="modal-actions">
            {/* 閲覧モード */}
            {isView && (
              <>
                <button
                  type="button"
                  className="btn-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
                <div className="modal-actions-right">
                  <button type="button" className="btn-cancel" onClick={onClose}>
                    閉じる
                  </button>
                  <button
                    type="button"
                    className="btn-save"
                    onClick={() => setMode('edit')}
                  >
                    編集
                  </button>
                </div>
              </>
            )}

            {/* 新規・編集モード */}
            {!isView && (
              <>
                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={isEdit ? () => setMode('view') : onClose}
                  >
                    キャンセル
                  </button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}

export default ScheduleModal;
