import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {BlurView} from '../util/BlurView'
import {ProfileModel} from 'state/models/content/profile'
import {useStores} from 'state/index'
import {ProfileImageLightbox} from 'state/models/ui/shell'
import {pluralize} from 'lib/strings/helpers'
import {toShareUrl} from 'lib/strings/url-helpers'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {s, colors} from 'lib/styles'
import {DropdownButton, DropdownItem} from '../util/forms/DropdownButton'
import * as Toast from '../util/Toast'
import {LoadingPlaceholder} from '../util/LoadingPlaceholder'
import {Text} from '../util/text/Text'
import {RichText} from '../util/text/RichText'
import {UserAvatar} from '../util/UserAvatar'
import {UserBanner} from '../util/UserBanner'
import {ProfileHeaderLabels} from '../util/moderation/ProfileHeaderLabels'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'
import {NavigationProp} from 'lib/routes/types'
import {isDesktopWeb} from 'platform/detection'
import {FollowState} from 'state/models/cache/my-follows'
import {shareUrl} from 'lib/sharing'

const BACK_HITSLOP = {left: 30, top: 30, right: 30, bottom: 30}

interface Props {
  view: ProfileModel
  onRefreshAll: () => void
  hideBackButton?: boolean
}

export const ProfileHeader = observer(
  ({view, onRefreshAll, hideBackButton = false}: Props) => {
    const pal = usePalette('default')

    // loading
    // =
    if (!view || !view.hasLoaded) {
      return (
        <View style={pal.view}>
          <LoadingPlaceholder width="100%" height={120} />
          <View
            style={[
              pal.view,
              {borderColor: pal.colors.background},
              styles.avi,
            ]}>
            <LoadingPlaceholder width={80} height={80} style={styles.br40} />
          </View>
          <View style={styles.content}>
            <View style={[styles.buttonsLine]}>
              <LoadingPlaceholder width={100} height={31} style={styles.br50} />
            </View>
            <View>
              <Text type="title-2xl" style={[pal.text, styles.title]}>
                {sanitizeDisplayName(view.displayName || view.handle)}
              </Text>
            </View>
          </View>
        </View>
      )
    }

    // error
    // =
    if (view.hasError) {
      return (
        <View testID="profileHeaderHasError">
          <Text>{view.error}</Text>
        </View>
      )
    }

    // loaded
    // =
    return (
      <ProfileHeaderLoaded
        view={view}
        onRefreshAll={onRefreshAll}
        hideBackButton={hideBackButton}
      />
    )
  },
)

const ProfileHeaderLoaded = observer(function ProfileHeaderLoaded({
  view,
  onRefreshAll,
  hideBackButton = false,
}: Props) {
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()

  const onPressBack = React.useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onPressAvi = React.useCallback(() => {
    if (view.avatar) {
      store.shell.openLightbox(new ProfileImageLightbox(view))
    }
  }, [store, view])

  const onPressToggleFollow = React.useCallback(() => {
    view?.toggleFollowing().then(
      () => {
        Toast.show(
          `${
            view.viewer.following ? 'Following' : 'No longer following'
          } ${sanitizeDisplayName(view.displayName || view.handle)}`,
        )
      },
      err => store.log.error('Failed to toggle follow', err),
    )
  }, [view, store])

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    store.shell.openModal({
      name: 'edit-profile',
      profileView: view,
      onUpdate: onRefreshAll,
    })
  }, [track, store, view, onRefreshAll])

  const onPressFollowers = React.useCallback(() => {
    track('ProfileHeader:FollowersButtonClicked')
    navigation.push('ProfileFollowers', {name: view.handle})
  }, [track, navigation, view])

  const onPressFollows = React.useCallback(() => {
    track('ProfileHeader:FollowsButtonClicked')
    navigation.push('ProfileFollows', {name: view.handle})
  }, [track, navigation, view])

  const onPressShare = React.useCallback(async () => {
    track('ProfileHeader:ShareButtonClicked')
    const url = toShareUrl(`/profile/${view.handle}`)
    shareUrl(url)
  }, [track, view])

  const onPressMuteAccount = React.useCallback(async () => {
    track('ProfileHeader:MuteAccountButtonClicked')
    try {
      await view.muteAccount()
      Toast.show('Account muted')
    } catch (e: any) {
      store.log.error('Failed to mute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, view, store])

  const onPressUnmuteAccount = React.useCallback(async () => {
    track('ProfileHeader:UnmuteAccountButtonClicked')
    try {
      await view.unmuteAccount()
      Toast.show('Account unmuted')
    } catch (e: any) {
      store.log.error('Failed to unmute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, view, store])

  const onPressReportAccount = React.useCallback(() => {
    track('ProfileHeader:ReportAccountButtonClicked')
    store.shell.openModal({
      name: 'report-account',
      did: view.did,
    })
  }, [track, store, view])

  const isMe = React.useMemo(
    () => store.me.did === view.did,
    [store.me.did, view.did],
  )
  const dropdownItems: DropdownItem[] = React.useMemo(() => {
    let items: DropdownItem[] = [
      {
        testID: 'profileHeaderDropdownSahreBtn',
        label: 'Share',
        onPress: onPressShare,
      },
    ]
    if (!isMe) {
      items.push({
        testID: 'profileHeaderDropdownMuteBtn',
        label: view.viewer.muted ? 'Unmute Account' : 'Mute Account',
        onPress: view.viewer.muted ? onPressUnmuteAccount : onPressMuteAccount,
      })
      items.push({
        testID: 'profileHeaderDropdownReportBtn',
        label: 'Report Account',
        onPress: onPressReportAccount,
      })
    }
    return items
  }, [
    isMe,
    view.viewer.muted,
    onPressShare,
    onPressUnmuteAccount,
    onPressMuteAccount,
    onPressReportAccount,
  ])
  return (
    <View style={pal.view}>
      <UserBanner banner={view.banner} />
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          {isMe ? (
            <TouchableOpacity
              testID="profileHeaderEditProfileButton"
              onPress={onPressEditProfile}
              style={[styles.btn, styles.mainBtn, pal.btn]}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              accessibilityHint="Opens editor for profile display name, avatar, background image, and description">
              <Text type="button" style={pal.text}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {store.me.follows.getFollowState(view.did) ===
              FollowState.Following ? (
                <TouchableOpacity
                  testID="unfollowBtn"
                  onPress={onPressToggleFollow}
                  style={[styles.btn, styles.mainBtn, pal.btn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Unfollow ${view.handle}`}
                  accessibilityHint={`Hides direct posts from ${view.handle} in your feed`}>
                  <FontAwesomeIcon
                    icon="check"
                    style={[pal.text, s.mr5]}
                    size={14}
                  />
                  <Text type="button" style={pal.text}>
                    Following
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="followBtn"
                  onPress={onPressToggleFollow}
                  style={[styles.btn, styles.primaryBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow ${view.handle}`}
                  accessibilityHint={`Shows direct posts from ${view.handle} in your feed`}>
                  <FontAwesomeIcon
                    icon="plus"
                    style={[s.white as FontAwesomeIconStyle, s.mr5]}
                  />
                  <Text type="button" style={[s.white, s.bold]}>
                    Follow
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {dropdownItems?.length ? (
            <DropdownButton
              testID="profileHeaderDropdownBtn"
              type="bare"
              items={dropdownItems}
              style={[styles.btn, styles.secondaryBtn, pal.btn]}>
              <FontAwesomeIcon icon="ellipsis" style={[pal.text]} />
            </DropdownButton>
          ) : undefined}
        </View>
        <View>
          <Text
            testID="profileHeaderDisplayName"
            type="title-2xl"
            style={[pal.text, styles.title]}>
            {sanitizeDisplayName(view.displayName || view.handle)}
          </Text>
        </View>
        <View style={styles.handleLine}>
          {view.viewer.followedBy ? (
            <View style={[styles.pill, pal.btn, s.mr5]}>
              <Text type="xs" style={[pal.text]}>
                Follows you
              </Text>
            </View>
          ) : undefined}
          <Text style={pal.textLight}>@{view.handle}</Text>
        </View>
        <View style={styles.metricsLine}>
          <TouchableOpacity
            testID="profileHeaderFollowersButton"
            style={[s.flexRow, s.mr10]}
            onPress={onPressFollowers}
            accessibilityRole="button"
            accessibilityLabel={`Show ${view.handle}'s followers`}
            accessibilityHint={`Shows folks following ${view.handle}`}>
            <Text type="md" style={[s.bold, s.mr2, pal.text]}>
              {view.followersCount}
            </Text>
            <Text type="md" style={[pal.textLight]}>
              {pluralize(view.followersCount, 'follower')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="profileHeaderFollowsButton"
            style={[s.flexRow, s.mr10]}
            onPress={onPressFollows}
            accessibilityRole="button"
            accessibilityLabel={`Show ${view.handle}'s follows`}
            accessibilityHint={`Shows folks followed by ${view.handle}`}>
            <Text type="md" style={[s.bold, s.mr2, pal.text]}>
              {view.followsCount}
            </Text>
            <Text type="md" style={[pal.textLight]}>
              following
            </Text>
          </TouchableOpacity>
          <Text type="md" style={[s.bold, pal.text]}>
            {view.postsCount}{' '}
            <Text type="md" style={[pal.textLight]}>
              {pluralize(view.postsCount, 'post')}
            </Text>
          </Text>
        </View>
        {view.descriptionRichText ? (
          <RichText
            testID="profileHeaderDescription"
            style={[styles.description, pal.text]}
            numberOfLines={15}
            richText={view.descriptionRichText}
          />
        ) : undefined}
        <ProfileHeaderLabels labels={view.labels} />
        {view.viewer.muted ? (
          <View
            testID="profileHeaderMutedNotice"
            style={[styles.detailLine, pal.btn, s.p5]}>
            <FontAwesomeIcon
              icon={['far', 'eye-slash']}
              style={[pal.text, s.mr5]}
            />
            <Text type="md" style={[s.mr2, pal.text]}>
              Account muted
            </Text>
          </View>
        ) : undefined}
      </View>
      {!isDesktopWeb && !hideBackButton && (
        <TouchableWithoutFeedback
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Navigates to the previous screen">
          <View style={styles.backBtnWrapper}>
            <BlurView style={styles.backBtn} blurType="dark">
              <FontAwesomeIcon size={18} icon="angle-left" style={s.white} />
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      )}
      <TouchableWithoutFeedback
        testID="profileHeaderAviButton"
        onPress={onPressAvi}
        accessibilityRole="image"
        accessibilityLabel={`View ${view.handle}'s avatar`}
        accessibilityHint={`Opens ${view.handle}'s avatar in an image viewer`}>
        <View
          style={[pal.view, {borderColor: pal.colors.background}, styles.avi]}>
          <UserAvatar
            size={80}
            avatar={view.avatar}
            hasWarning={!!view.labels?.length}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
})

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 120,
  },
  backBtnWrapper: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    overflow: 'hidden',
    borderRadius: 15,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avi: {
    position: 'absolute',
    top: 110,
    left: 10,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },

  buttonsLine: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.blue3,
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  mainBtn: {
    paddingHorizontal: 24,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
  },
  title: {lineHeight: 38},

  handleLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  metricsLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  description: {
    marginBottom: 8,
  },

  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  pill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  br40: {borderRadius: 40},
  br50: {borderRadius: 50},
})
