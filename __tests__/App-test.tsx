import 'react-native'
import React from 'react'
import App from '../src/App.native'

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer'

it('renders correctly', () => {
  renderer.act(() => {
    renderer.create(<App />)
  })
})
