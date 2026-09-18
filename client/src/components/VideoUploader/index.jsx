import { InboxOutlined } from '@ant-design/icons'
import { Upload } from 'antd'

export function VideoUploader({ file, onSelect }) {
  return (
    <Upload.Dragger
      accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
      maxCount={1}
      multiple={false}
      beforeUpload={(uploaded) => {
        onSelect(uploaded)
        return false
      }}
      fileList={file ? [{ uid: file.name, name: file.name, status: 'done' }] : []}
      onRemove={() => onSelect(null)}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Arrastra el video de la entrevista aquí</p>
      <p className="ant-upload-hint">o haz clic para seleccionarlo (MP4, MOV, AVI, MKV, WEBM)</p>
    </Upload.Dragger>
  )
}