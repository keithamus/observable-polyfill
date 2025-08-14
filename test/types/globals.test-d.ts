import * as observable from "observable-polyfill";
import { describe, it, expectTypeOf } from "vitest";

type Whenable<EventMap extends {}> = {
  when<K extends keyof EventMap>(
    event: K,
    options?: ObservableEventListenerOptions
  ): Observable<EventMap[K]>;
};

describe("Globals", () => {
  it("registers global Observable class and type", () => {
    expectTypeOf(Observable).toEqualTypeOf<typeof observable.Observable>();
    expectTypeOf<Observable>().toEqualTypeOf<observable.Observable>();
  });

  it("registers global ObservableEventListenerOptions type", () => {
    expectTypeOf<ObservableEventListenerOptions>().toEqualTypeOf<observable.ObservableEventListenerOptions>();
  });

  it("augments EventTarget with when()", () => {
    expectTypeOf<EventTarget>().toExtend<{
      when(
        type: string,
        options?: ObservableEventListenerOptions
      ): Observable<Event>;
    }>();
    const target = new EventTarget();
    expectTypeOf(target.when("foo")).toEqualTypeOf<Observable<Event>>();
  });

  it("augments specific EventTargets with a more specific when()", () => {
    expectTypeOf<AbortSignal>().toExtend<Whenable<AbortSignalEventMap>>();
    expectTypeOf<AbstractWorker>().toExtend<Whenable<AbstractWorkerEventMap>>();
    expectTypeOf<Animation>().toExtend<Whenable<AnimationEventMap>>();
    expectTypeOf<AudioDecoder>().toExtend<Whenable<AudioDecoderEventMap>>();
    expectTypeOf<AudioEncoder>().toExtend<Whenable<AudioEncoderEventMap>>();
    expectTypeOf<AudioScheduledSourceNode>().toExtend<
      Whenable<AudioScheduledSourceNodeEventMap>
    >();
    expectTypeOf<AudioWorkletNode>().toExtend<
      Whenable<AudioWorkletNodeEventMap>
    >();
    expectTypeOf<BaseAudioContext>().toExtend<
      Whenable<BaseAudioContextEventMap>
    >();
    expectTypeOf<BroadcastChannel>().toExtend<
      Whenable<BroadcastChannelEventMap>
    >();
    expectTypeOf<CookieStore>().toExtend<Whenable<CookieStoreEventMap>>();
    expectTypeOf<Document>().toExtend<Whenable<DocumentEventMap>>();
    expectTypeOf<Element>().toExtend<Whenable<ElementEventMap>>();
    expectTypeOf<EventSource>().toExtend<Whenable<EventSourceEventMap>>();
    expectTypeOf<FileReader>().toExtend<Whenable<FileReaderEventMap>>();
    expectTypeOf<FontFaceSet>().toExtend<Whenable<FontFaceSetEventMap>>();
    expectTypeOf<GlobalEventHandlers>().toExtend<
      Whenable<GlobalEventHandlersEventMap>
    >();
    expectTypeOf<HTMLBodyElement>().toExtend<
      Whenable<HTMLBodyElementEventMap>
    >();
    expectTypeOf<HTMLElement>().toExtend<Whenable<HTMLElementEventMap>>();
    expectTypeOf<HTMLFrameSetElement>().toExtend<
      Whenable<HTMLFrameSetElementEventMap>
    >();
    expectTypeOf<HTMLMediaElement>().toExtend<
      Whenable<HTMLMediaElementEventMap>
    >();
    expectTypeOf<HTMLVideoElement>().toExtend<
      Whenable<HTMLVideoElementEventMap>
    >();
    expectTypeOf<IDBDatabase>().toExtend<Whenable<IDBDatabaseEventMap>>();
    expectTypeOf<IDBOpenDBRequest>().toExtend<
      Whenable<IDBOpenDBRequestEventMap>
    >();
    expectTypeOf<IDBRequest>().toExtend<Whenable<IDBRequestEventMap>>();
    expectTypeOf<IDBTransaction>().toExtend<Whenable<IDBTransactionEventMap>>();
    expectTypeOf<MIDIAccess>().toExtend<Whenable<MIDIAccessEventMap>>();
    expectTypeOf<MIDIInput>().toExtend<Whenable<MIDIInputEventMap>>();
    expectTypeOf<MIDIPort>().toExtend<Whenable<MIDIPortEventMap>>();
    expectTypeOf<MathMLElement>().toExtend<Whenable<MathMLElementEventMap>>();
    expectTypeOf<MediaDevices>().toExtend<Whenable<MediaDevicesEventMap>>();
    expectTypeOf<MediaKeySession>().toExtend<
      Whenable<MediaKeySessionEventMap>
    >();
    expectTypeOf<MediaQueryList>().toExtend<Whenable<MediaQueryListEventMap>>();
    expectTypeOf<MediaRecorder>().toExtend<Whenable<MediaRecorderEventMap>>();
    expectTypeOf<MediaSource>().toExtend<Whenable<MediaSourceEventMap>>();
    expectTypeOf<MediaStream>().toExtend<Whenable<MediaStreamEventMap>>();
    expectTypeOf<MediaStreamTrack>().toExtend<
      Whenable<MediaStreamTrackEventMap>
    >();
    expectTypeOf<MessageEventTarget<any>>().toExtend<
      Whenable<MessageEventTargetEventMap>
    >();
    expectTypeOf<MessagePort>().toExtend<Whenable<MessagePortEventMap>>();
    expectTypeOf<NavigationHistoryEntry>().toExtend<
      Whenable<NavigationHistoryEntryEventMap>
    >();
    expectTypeOf<Notification>().toExtend<Whenable<NotificationEventMap>>();
    expectTypeOf<OfflineAudioContext>().toExtend<
      Whenable<OfflineAudioContextEventMap>
    >();
    expectTypeOf<OffscreenCanvas>().toExtend<
      Whenable<OffscreenCanvasEventMap>
    >();
    expectTypeOf<PaymentRequest>().toExtend<Whenable<PaymentRequestEventMap>>();
    expectTypeOf<PaymentResponse>().toExtend<
      Whenable<PaymentResponseEventMap>
    >();
    expectTypeOf<Performance>().toExtend<Whenable<PerformanceEventMap>>();
    expectTypeOf<PermissionStatus>().toExtend<
      Whenable<PermissionStatusEventMap>
    >();
    expectTypeOf<PictureInPictureWindow>().toExtend<
      Whenable<PictureInPictureWindowEventMap>
    >();
    expectTypeOf<RTCDTMFSender>().toExtend<Whenable<RTCDTMFSenderEventMap>>();
    expectTypeOf<RTCDataChannel>().toExtend<Whenable<RTCDataChannelEventMap>>();
    expectTypeOf<RTCDtlsTransport>().toExtend<
      Whenable<RTCDtlsTransportEventMap>
    >();
    expectTypeOf<RTCIceTransport>().toExtend<
      Whenable<RTCIceTransportEventMap>
    >();
    expectTypeOf<RTCPeerConnection>().toExtend<
      Whenable<RTCPeerConnectionEventMap>
    >();
    expectTypeOf<RTCSctpTransport>().toExtend<
      Whenable<RTCSctpTransportEventMap>
    >();
    expectTypeOf<RemotePlayback>().toExtend<Whenable<RemotePlaybackEventMap>>();
    expectTypeOf<SVGElement>().toExtend<Whenable<SVGElementEventMap>>();
    expectTypeOf<ScreenOrientation>().toExtend<
      Whenable<ScreenOrientationEventMap>
    >();
    expectTypeOf<ScriptProcessorNode>().toExtend<
      Whenable<ScriptProcessorNodeEventMap>
    >();
    expectTypeOf<ServiceWorkerContainer>().toExtend<
      Whenable<ServiceWorkerContainerEventMap>
    >();
    expectTypeOf<ServiceWorkerRegistration>().toExtend<
      Whenable<ServiceWorkerRegistrationEventMap>
    >();
    expectTypeOf<ShadowRoot>().toExtend<Whenable<ShadowRootEventMap>>();
    expectTypeOf<SourceBuffer>().toExtend<Whenable<SourceBufferEventMap>>();
    expectTypeOf<SourceBufferList>().toExtend<
      Whenable<SourceBufferListEventMap>
    >();
    expectTypeOf<SpeechSynthesis>().toExtend<
      Whenable<SpeechSynthesisEventMap>
    >();
    expectTypeOf<SpeechSynthesisUtterance>().toExtend<
      Whenable<SpeechSynthesisUtteranceEventMap>
    >();
    expectTypeOf<TextTrack>().toExtend<Whenable<TextTrackEventMap>>();
    expectTypeOf<TextTrackCue>().toExtend<Whenable<TextTrackCueEventMap>>();
    expectTypeOf<TextTrackList>().toExtend<Whenable<TextTrackListEventMap>>();
    expectTypeOf<VideoDecoder>().toExtend<Whenable<VideoDecoderEventMap>>();
    expectTypeOf<VideoEncoder>().toExtend<Whenable<VideoEncoderEventMap>>();
    expectTypeOf<VisualViewport>().toExtend<Whenable<VisualViewportEventMap>>();
    expectTypeOf<WakeLockSentinel>().toExtend<
      Whenable<WakeLockSentinelEventMap>
    >();
    expectTypeOf<WebSocket>().toExtend<Whenable<WebSocketEventMap>>();
    expectTypeOf<Window>().toExtend<Whenable<WindowEventMap>>();
    expectTypeOf<WindowEventHandlers>().toExtend<
      Whenable<WindowEventHandlersEventMap>
    >();
    expectTypeOf<Worker>().toExtend<Whenable<WorkerEventMap>>();
    expectTypeOf<XMLHttpRequest>().toExtend<Whenable<XMLHttpRequestEventMap>>();
    expectTypeOf<XMLHttpRequestEventTarget>().toExtend<
      Whenable<XMLHttpRequestEventTargetEventMap>
    >();
  });
  it("registers global when() function", () => {
    expectTypeOf(when).toBeCallableWith("foo");
    expectTypeOf(when).toBeCallableWith("foo", {});
  });
});
