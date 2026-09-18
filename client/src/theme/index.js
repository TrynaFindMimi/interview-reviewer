import { theme } from 'antd'

const LIGHT_TOKEN = {
  colorPrimary: '#2f54eb',
  borderRadius: 8,
}

const DARK_TOKEN = {
  colorPrimary: '#597ef7',
  borderRadius: 8,
}

export function getAntdTheme(mode) {
  return {
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: mode === 'dark' ? DARK_TOKEN : LIGHT_TOKEN,
  }
}