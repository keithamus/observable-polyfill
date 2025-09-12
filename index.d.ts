import {
  Observable as _Observable,
  ObservableEventListenerOptions as _ObservableEventListenerOptions,
} from "./observable";

// the "type" here is important, we want to re-export all types without the runtime exports
export type * from "./observable";

declare global {
  type ObservableEventListenerOptions = _ObservableEventListenerOptions;

  type Observable<T = any> = _Observable<T>;
  var Observable: typeof _Observable;

  interface EventTarget {
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface AbortSignal {
    when<K extends keyof AbortSignalEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<AbortSignalEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface AbstractWorker {
    when<K extends keyof AbstractWorkerEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<AbstractWorkerEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Animation {
    when<K extends keyof AnimationEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<AnimationEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // AudioBufferSourceNode inherits from AudioScheduledSourceNode

  // AudioContext inherits from BaseAudioContext

  interface AudioDecoder {
    when<K extends keyof AudioDecoderEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<AudioDecoderEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface AudioEncoder {
    when<K extends keyof AudioEncoderEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<AudioEncoderEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface AudioScheduledSourceNode {
    when<K extends keyof AudioScheduledSourceNodeEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<AudioScheduledSourceNodeEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface AudioWorkletNode {
    when<K extends keyof AudioWorkletNodeEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<AudioWorkletNodeEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface BaseAudioContext {
    when<K extends keyof BaseAudioContextEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<BaseAudioContextEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface BroadcastChannel {
    when<K extends keyof BroadcastChannelEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<BroadcastChannelEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // CSSAnimation, CSSTransition inherits from Animation

  // CanvasCaptureMediaStreamTrack inherits from MediaStreamTrack

  // ConstantSourceNode inherits from AudioScheduledSourceNode

  interface CookieStore {
    when<K extends keyof CookieStoreEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<CookieStoreEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Document {
    when<K extends keyof DocumentEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<DocumentEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Element {
    when<K extends keyof ElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface EventSource {
    when<K extends keyof EventSourceEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<EventSourceEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface FileReader {
    when<K extends keyof FileReaderEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<FileReaderEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface FontFaceSet {
    when<K extends keyof FontFaceSetEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<FontFaceSetEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface GlobalEventHandlers {
    when<K extends keyof GlobalEventHandlersEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<GlobalEventHandlersEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // HTMLAnchorElement, HTMLAreaElement inherits from HTMLElement

  // HTMLAudioElement inherits from HTMLMediaElement

  // HTMLBRElement, HTMLBaseElement inherits from HTMLElement

  interface HTMLBodyElement {
    when<K extends keyof HTMLBodyElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLBodyElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // HTMLButtonElement, HTMLCanvasElement, HTMLDListElement, HTMLDataElement, HTMLDataListElement, HTMLDetailsElement, HTMLDialogElement, HTMLDirectoryElement, HTMLDivElement, inherits from HTMLElement

  // HTMLDocument inherits from Document

  interface HTMLElement {
    when<K extends keyof HTMLElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // HTMLEmbedElement, HTMLFieldSetElement, HTMLFontElement, HTMLFormElement, HTMLFrameElement inherits from HTMLElement

  interface HTMLFrameSetElement {
    when<K extends keyof HTMLFrameSetElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLFrameSetElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // HTMLHRElement, HTMLHeadElement, HTMLHeadingElement, HTMLHtmlElement, HTMLIframeElement, HTMLImageElement, HTMLInputElement, HTMLLIElement, HTMLLabelElement, HTMLLegendElement, HTMLLinkElement, HTMLMapElement, HTMLMarqueeElement inherits from HTMLElement

  interface HTMLMediaElement {
    when<K extends keyof HTMLMediaElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLMediaElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // HTMLMenuElement, HTMLMetaElement, HTMLMeterElement, HTMLModElement, HTMLOListElement, HTMLObjectElement, HTMLOptGroupElement, HTMLOptionElement, HTMLOutputElement, HTMLParagraphElement, HTMLParamElement, HTMLPictureElement, HTMLPreElement, HTMLProgressElement, HTMLQuoteElement, HTMLScriptElement, HTMLSelectElement, HTMLSlotElement, HTMLSourceElement, HTMLSpanElement, HTMLStyleElement, HTMLTableCaptionElement, HTMLTableCellElement, HTMLTableColElement, HTMLTableDataCellElement, HTMLTableElement, HTMLTableHeaderCellElement, HTMLTableRowElement, HTMLTableSectionElement, HTMLTemplateElement, HTMLTextAreaElement, HTMLTimeElement, HTMLTitleElement, HTMLTrackElement, HTMLUListElement, HTMLUnknownElement inherits from HTMLElement

  interface HTMLVideoElement {
    when<K extends keyof HTMLVideoElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLVideoElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface IDBDatabase {
    when<K extends keyof IDBDatabaseEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<IDBDatabaseEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface IDBOpenDBRequest {
    when<K extends keyof IDBOpenDBRequestEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<IDBOpenDBRequestEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface IDBRequest<T = any> {
    when<K extends keyof IDBRequestEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<IDBRequestEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface IDBTransaction {
    when<K extends keyof IDBTransactionEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<IDBTransactionEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MIDIAccess {
    when<K extends keyof MIDIAccessEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MIDIAccessEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MIDIInput {
    when<K extends keyof MIDIInputEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MIDIInputEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // MIDIOutput inherits from MIDIPort

  interface MIDIPort {
    when<K extends keyof MIDIPortEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MIDIPortEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MathMlElement {
    when<K extends keyof MathMLElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MathMLElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MediaDevices {
    when<K extends keyof MediaDevicesEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MediaDevicesEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MediaKeySession {
    when<K extends keyof MediaKeySessionEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MediaKeySessionEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MediaQueryList {
    when<K extends keyof MediaQueryListEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MediaQueryListEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MediaRecorder {
    when<K extends keyof MediaRecorderEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MediaRecorderEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MediaSource {
    when<K extends keyof MediaSourceEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MediaSourceEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MediaStream {
    when<K extends keyof MediaStreamEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MediaStreamEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MediaStreamTrack {
    when<K extends keyof MediaStreamTrackEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MediaStreamTrackEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MessageEventTarget<T> {
    when<K extends keyof MessageEventTargetEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MessageEventTargetEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface MessagePort {
    when<K extends keyof MessagePortEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<MessagePortEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface NavigationHistoryEntry {
    when<K extends keyof NavigationHistoryEntryEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<NavigationHistoryEntryEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Notification {
    when<K extends keyof NotificationEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<NotificationEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface OfflineAudioContext {
    when<K extends keyof OfflineAudioContextEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<OfflineAudioContextEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface OffscreenCanvas {
    when<K extends keyof OffscreenCanvasEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<OffscreenCanvasEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // OscillatorNode inherits from AudioScheduledSourceNode

  interface PaymentRequest {
    when<K extends keyof PaymentRequestEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<PaymentRequestEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface PaymentResponse {
    when<K extends keyof PaymentResponseEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<PaymentResponseEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Performance {
    when<K extends keyof PerformanceEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<PerformanceEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface PermissionStatus {
    when<K extends keyof PermissionStatusEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<PermissionStatusEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface PictureInPictureWindow {
    when<K extends keyof PictureInPictureWindowEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<PictureInPictureWindowEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface RTCDTMFSender {
    when<K extends keyof RTCDTMFSenderEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<RTCDTMFSenderEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface RTCDataChannel {
    when<K extends keyof RTCDataChannelEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<RTCDataChannelEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface RTCDtlsTransport {
    when<K extends keyof RTCDtlsTransportEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<RTCDtlsTransportEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface RTCIceTransport {
    when<K extends keyof RTCIceTransportEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<RTCIceTransportEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface RTCPeerConnection {
    when<K extends keyof RTCPeerConnectionEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<RTCPeerConnectionEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface RTCSctpTransport {
    when<K extends keyof RTCSctpTransportEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<RTCSctpTransportEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface RemotePlayback {
    when<K extends keyof RemotePlaybackEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<RemotePlaybackEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // SVGAElement, SVGAnimateElement, SVGAnimateMotionElement, SVGAnimateTransformElement, SVGAnimationElement, SVGCircleElement, SVGClipPathElement, SVGComponentTransferFunctionElement, SVGDefsElement, SVGDescElement inherits from SVGGraphicsElement

  interface SVGElement {
    when<K extends keyof SVGElementEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<SVGElementEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // SVGEllipseElement, SVGFEBlendElement, SVGFEColorMatrixElement, SVGFEComponentTransferElement, SVGFECompositeElement, SVGFEConvolveMatrixElement, SVGFEDiffuseLightingElement, SVGFEDisplacementMapElement, SVGFEDistantLightElement, SVGFEDropShadowElement, SVGFEFloodElement, SVGFEFuncAElement, SVGFEFuncBElement, SVGFEFuncGElement, SVGFEFuncRElement, SVGFEGaussianBlurElement, SVGFEImageElement, SVGFEMergeElement, SVGFEMergeNodeElement, SVGFEMorphologyElement, SVGFEOffsetElement, SVGFEPointLightElement, SVGFESpecularLightingElement, SVGFESpotLightElement, SVGFETileElement, SVGFETurbulenceElement, SVGFilterElement, SVGForeignObjectElement, SVGGElement, SVGGeometryElement, SVGGradientElement, SVGGraphicsElement, SVGImageElement, SVGLineElement, SVGLinearGradientElement, SVGMPathElement, SVGMarkerElement, SVGMaskElement, SVGMetadataElement, SVGPathElement, SVGPatternElement, SVGPolygonElement, SVGPolylineElement, SVGPatternElement, SVGRadialGradientElement, SVGRectElement, SVGSVGElement, SVGScriptElement, SVGSetElement, SVGStopElement, SVGStyleElement, SVGSwitchElement, SVGSymbolElement, SVGTSpanElement, SVGTextContentElement, SVGTextElement, SVGTextPathElement, SVGTextPositioningElement, SVGTitleElement, SVGUseElement, SVGViewElement inherits from SVGElement

  interface ScreenOrientation {
    when<K extends keyof ScreenOrientationEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<ScreenOrientationEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface ScriptProcessorNode {
    when<K extends keyof ScriptProcessorNodeEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<ScriptProcessorNodeEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface ServiceWorker {
    when<K extends keyof ServiceWorkerEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<ServiceWorkerEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface ServiceWorkerContainer {
    when<K extends keyof ServiceWorkerContainerEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<ServiceWorkerContainerEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface ServiceWorkerRegistration {
    when<K extends keyof ServiceWorkerRegistrationEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<ServiceWorkerRegistrationEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface ShadowRoot {
    when<K extends keyof ShadowRootEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<ShadowRootEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // SharedWorker inherits from AbstractWorker

  interface SourceBuffer {
    when<K extends keyof SourceBufferEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<SourceBufferEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface SourceBufferList {
    when<K extends keyof SourceBufferListEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<SourceBufferListEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface SpeechSynthesis {
    when<K extends keyof SpeechSynthesisEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<SpeechSynthesisEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface SpeechSynthesisUtterance {
    when<K extends keyof SpeechSynthesisUtteranceEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<SpeechSynthesisUtteranceEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface TextTrack {
    when<K extends keyof TextTrackEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<TextTrackEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface TextTrackCue {
    when<K extends keyof TextTrackCueEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<TextTrackCueEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface TextTrackList {
    when<K extends keyof TextTrackListEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<TextTrackListEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // VTTCue inherits from TextTrackCue

  interface VideoDecoder {
    when<K extends keyof VideoDecoderEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<VideoDecoderEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface VideoEncoder {
    when<K extends keyof VideoEncoderEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<VideoEncoderEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface VisualViewport {
    when<K extends keyof VisualViewportEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<VisualViewportEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface WakeLockSentinel {
    when<K extends keyof WakeLockSentinelEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<WakeLockSentinelEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface WebSocket {
    when<K extends keyof WebSocketEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<WebSocketEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Window {
    when<K extends keyof WindowEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<WindowEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface WindowEventHandlers {
    when<K extends keyof WindowEventHandlersEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<WindowEventHandlersEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Worker {
    when<K extends keyof WorkerEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<WorkerEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // XMLDocument inherits from Document

  interface XMLHttpRequest {
    when<K extends keyof XMLHttpRequestEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<XMLHttpRequestEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface XMLHttpRequestEventTarget {
    when<K extends keyof XMLHttpRequestEventTargetEventMap>(
      event: K,
      options?: ObservableEventListenerOptions
    ): Observable<XMLHttpRequestEventTargetEventMap[K]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  // XMLHttpRequestUpload inherits from XMLHttpRequestEventTarget

  function when<K extends keyof WindowEventMap>(
    event: K,
    options?: ObservableEventListenerOptions
  ): Observable<WindowEventMap[K]>;
  function when(
    type: string,
    options?: ObservableEventListenerOptions
  ): Observable<Event>;
}
