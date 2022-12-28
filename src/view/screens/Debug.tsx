import React from 'react'
import {ScrollView, View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {Text} from '../com/util/Text'
import {ThemeProvider, useTheme} from '../lib/ThemeContext'
import {PaletteColorName} from '../lib/ThemeContext'
import {usePalette} from '../lib/hooks/usePalette'

import {ViewSelector} from '../com/util/ViewSelector'
import {Button} from '../com/util/forms/Button'
import {RadioGroup} from '../com/util/forms/RadioGroup'

const MAIN_VIEWS = ['Base', 'Controls']

export const Debug = () => {
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark'>(
    'light',
  )
  const [currentView, setCurrentView] = React.useState<number>(0)
  const onToggleColorScheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light')
  }

  const renderItem = item => {
    return (
      <View>
        <View style={{paddingTop: 10, paddingHorizontal: 10}}>
          <Button
            type="primary-outline"
            onPress={onToggleColorScheme}
            label={colorScheme}
          />
        </View>
        {item.currentView === 1 ? (
          <ControlsView key="controls" />
        ) : (
          <BaseView key="base" />
        )}
        <View style={{height: 200}} />
      </View>
    )
  }

  const items = [{currentView}]

  return (
    <ThemeProvider theme={colorScheme}>
      <View style={{flex: 1}}>
        <ViewHeader title="Debug panel" />
        <ViewSelector
          swipeEnabled
          sections={MAIN_VIEWS}
          items={items}
          renderItem={renderItem}
          onSelectView={setCurrentView}
        />
      </View>
    </ThemeProvider>
  )
}

function Heading({label}: {label: string}) {
  const theme = useTheme()
  return (
    <View style={{paddingTop: 10, paddingBottom: 5}}>
      <Text style={theme.typography.h2}>{label}</Text>
    </View>
  )
}

function BaseView() {
  return (
    <View style={{paddingHorizontal: 10}}>
      <Heading label="Palettes" />
      <PaletteView palette="default" />
      <PaletteView palette="primary" />
      <PaletteView palette="secondary" />
      <PaletteView palette="error" />
      <Heading label="Typography" />
      <TypographyView />
    </View>
  )
}

function ControlsView() {
  return (
    <ScrollView style={{paddingHorizontal: 10}}>
      <Heading label="Buttons" />
      <ButtonsView />
      <Heading label="Radio Buttons" />
      <RadioButtonsView />
    </ScrollView>
  )
}

function PaletteView({palette}: {palette: PaletteColorName}) {
  const theme = useTheme()
  const defaultPal = usePalette('default')
  const pal = usePalette(palette)
  return (
    <View
      style={[
        pal.view,
        pal.border,
        {
          padding: 10,
          marginBottom: 5,
        },
      ]}>
      <Text style={[theme.typography.body1, pal.text]}>{palette} colors</Text>
      <Text style={[theme.typography.body1, pal.textLight]}>Light text</Text>
      <Text style={[theme.typography.body1, pal.link]}>Link text</Text>
      {palette !== 'default' && (
        <View style={[defaultPal.view]}>
          <Text style={[theme.typography.body1, pal.textInverted]}>
            Inverted text
          </Text>
        </View>
      )}
    </View>
  )
}

function TypographyView() {
  const theme = useTheme()
  const pal = usePalette('default')
  return (
    <View
      style={[
        pal.view,
        pal.border,
        {
          marginBottom: 5,
          padding: 5,
        },
      ]}>
      <Text style={[pal.text, theme.typography.h1]}>Heading 1</Text>
      <Text style={[pal.text, theme.typography.h2]}>Heading 2</Text>
      <Text style={[pal.text, theme.typography.h3]}>Heading 3</Text>
      <Text style={[pal.text, theme.typography.h4]}>Heading 4</Text>
      <Text style={[pal.text, theme.typography.subtitle1]}>Subtitle 1</Text>
      <Text style={[pal.text, theme.typography.subtitle2]}>Subtitle 2</Text>
      <Text style={[pal.text, theme.typography.body1]}>Body 1</Text>
      <Text style={[pal.text, theme.typography.body2]}>Body 2</Text>
      <Text style={[pal.text, theme.typography.button]}>Button</Text>
      <Text style={[pal.text, theme.typography.caption]}>Caption</Text>
      <Text style={[pal.text, theme.typography.overline]}>Overline</Text>
    </View>
  )
}

function ButtonsView() {
  const defaultPal = usePalette('default')
  const buttonStyles = {marginRight: 5}
  return (
    <View
      style={[
        defaultPal.view,
        defaultPal.border,
        {
          marginBottom: 5,
          padding: 5,
        },
      ]}>
      <View
        style={{
          flexDirection: 'row',
          marginBottom: 5,
        }}>
        <Button type="primary" label="Primary solid" style={buttonStyles} />
        <Button type="secondary" label="Secondary solid" style={buttonStyles} />
      </View>
      <View style={{flexDirection: 'row'}}>
        <Button
          type="primary-outline"
          label="Primary outline"
          style={buttonStyles}
        />
        <Button
          type="secondary-outline"
          label="Secondary outline"
          style={buttonStyles}
        />
      </View>
      <View style={{flexDirection: 'row'}}>
        <Button
          type="primary-light"
          label="Primary light"
          style={buttonStyles}
        />
        <Button
          type="secondary-light"
          label="Secondary light"
          style={buttonStyles}
        />
      </View>
      <View style={{flexDirection: 'row'}}>
        <Button
          type="default-light"
          label="Default light"
          style={buttonStyles}
        />
      </View>
    </View>
  )
}

const RADIO_BUTTON_ITEMS = [
  {key: 'default-light', label: 'Default Light'},
  {key: 'primary', label: 'Primary'},
  {key: 'secondary', label: 'Secondary'},
  {key: 'primary-outline', label: 'Primary Outline'},
  {key: 'secondary-outline', label: 'Secondary Outline'},
  {key: 'primary-light', label: 'Primary Light'},
  {key: 'secondary-light', label: 'Secondary Light'},
]
function RadioButtonsView() {
  const defaultPal = usePalette('default')
  const [rgType, setRgType] = React.useState('default-light')
  return (
    <View
      style={[
        defaultPal.view,
        defaultPal.border,
        {
          marginBottom: 5,
          padding: 5,
        },
      ]}>
      <RadioGroup
        type={rgType}
        items={RADIO_BUTTON_ITEMS}
        initialSelection="default-light"
        onSelect={setRgType}
      />
    </View>
  )
}
