import {
  CommentOutlined,
  EyeOutlined,
  RiseOutlined,
  SmileOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Progress, Row, Statistic, Typography } from 'antd'

const METRICS = [
  { key: 'smiles', label: 'Sonrisas', Icon: SmileOutlined },
  { key: 'eyebrow_raises', label: 'Cejas levantadas', Icon: RiseOutlined },
  { key: 'blinks', label: 'Parpadeos', Icon: EyeOutlined },
  { key: 'jaw_opens', label: 'Boca abierta', Icon: CommentOutlined },
]

export function GestureMetrics({ result }) {
  const presence = Math.round(result.face_presence * 100)

  return (
    <>
      <Row gutter={[16, 16]}>
        {METRICS.map(({ key, label, Icon }) => (
          <Col xs={12} sm={6} key={key}>
            <Card>
              <Statistic title={label} value={result[key]} prefix={<Icon />} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Statistic
          title="Presencia facial"
          value={presence}
          suffix="%"
          prefix={<TeamOutlined />}
        />
        <Progress percent={presence} />
        <Typography.Text type="secondary">
          Rostro detectado en {result.frames_with_face} de {result.total_frames} frames
        </Typography.Text>
      </Card>
    </>
  )
}