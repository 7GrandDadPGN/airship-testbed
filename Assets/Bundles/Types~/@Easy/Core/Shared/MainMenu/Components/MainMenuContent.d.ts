/// <reference types="@easy-games/compiler-types" />
export default class MainMenuContent extends AirshipBehaviour {
    canvasRect: RectTransform;
    canvasScalar: CanvasScaler;
    contentWrapper: RectTransform;
    socialMenu: RectTransform;
    friendsPage: RectTransform;
    pages: RectTransform;
    searchFocused: RectTransform;
    mobileNav: RectTransform;
    navbar: RectTransform;
    navbarContentWrapper: RectTransform;
    navbarTabs: RectTransform[];
    navbarLeft: RectTransform;
    navbarRight: RectTransform;
    private mainMenu;
    private bin;
    Start(): void;
    Update(dt: number): void;
    CalcLayout(): void;
    OnDestroy(): void;
}
