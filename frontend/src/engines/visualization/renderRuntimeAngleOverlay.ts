import type { FilteredRuntimePose } from "../pose";
import { getJointAngleDefinition, type FormalJointAngleResult, type JointAngleMetricId, type RuntimeJointAngleResult } from "../motionModel";
import { projectProductionSkeletonPoint, type SkeletonObjectFit, type SkeletonSourceViewport } from "./renderProductionSkeleton";
import type { SkeletonSide } from "./productionSkeletonProfile";
import { RUNTIME_ANGLE_OVERLAY_PROFILE, type RuntimeAngleOverlayDisplayProfile } from "./runtimeAngleOverlayProfile";

export type OverlayPoint = Readonly<{ x: number; y: number }>;
export type RuntimeAngleArcGeometry = Readonly<{ center: OverlayPoint; radius: number; startAngle: number; endAngle: number; anticlockwise: boolean; spanRadians: number }>;
export type RuntimeAngleLabelBounds = Readonly<{ x: number; y: number; width: number; height: number }>;
export type PreparedRuntimeAngleOverlayMetric = Readonly<{
  metricId: JointAngleMetricId; side: SkeletonSide; status: "available" | "degraded";
  valueDegrees: number; displayValue: string; computationCoordinateSpace: "world-3d" | "normalized-2d";
  points: readonly [OverlayPoint, OverlayPoint, OverlayPoint]; vertex: OverlayPoint;
  arc: RuntimeAngleArcGeometry | null; labelAnchor: OverlayPoint | null; labelBounds: RuntimeAngleLabelBounds | null;
  labelVisible: boolean; suppressionReason: null | "collision";
}>;
export type RuntimeAngleOverlayDiagnostics = Readonly<{
  requestedMetricCount: number; renderedArcCount: number; renderedLabelCount: number;
  unavailableSkipped: number; missingDisplayLandmarksSkipped: number; identityMismatchSkipped: number;
  degenerateGeometrySkipped: number; collisionSuppressedLabels: number;
}>;
export type PreparedRuntimeAngleOverlay = Readonly<{ metrics: readonly PreparedRuntimeAngleOverlayMetric[]; diagnostics: RuntimeAngleOverlayDiagnostics }>;
export type RuntimeAngleOverlayOptions = Readonly<{
  selectedMetricIds: readonly JointAngleMetricId[]; sourceViewport?: SkeletonSourceViewport; mirror?: boolean;
  objectFit?: SkeletonObjectFit; poseAgeMs?: number; clear?: boolean; profile?: RuntimeAngleOverlayDisplayProfile;
}>;
export type RuntimeAngleOverlayDisplayScale = Readonly<{ devicePixelRatio: number; viewportScale: number; arcWidth: number; fontSize: number; labelOffset: number }>;
export type AngleOverlayDisplayPose = Pick<FilteredRuntimePose, "timestampMs" | "frameIndex" | "cameraSessionId" | "landmarks2D">;
type DisplayableAngleResult = Pick<RuntimeJointAngleResult | FormalJointAngleResult, "metricId" | "status" | "valueDegrees" | "coordinateSpace" | "frameIndex" | "cameraSessionId">;

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const distance = (a: OverlayPoint, b: OverlayPoint) => Math.hypot(a.x - b.x, a.y - b.y);

export function getRuntimeAngleOverlayDisplayScale(canvas: HTMLCanvasElement, profile: RuntimeAngleOverlayDisplayProfile = RUNTIME_ANGLE_OVERLAY_PROFILE): RuntimeAngleOverlayDisplayScale {
  const rect = typeof canvas.getBoundingClientRect === "function" ? canvas.getBoundingClientRect() : null;
  const cssWidth = rect?.width && rect.width > 0 ? rect.width : canvas.width;
  const dpr = cssWidth > 0 ? canvas.width / cssWidth : 1;
  const safeDpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const viewportScale = clamp(cssWidth / profile.viewportScale.referenceWidthCssPx, profile.viewportScale.minimum, profile.viewportScale.maximum);
  return {
    devicePixelRatio: safeDpr, viewportScale,
    arcWidth: clamp(profile.arcWidth.baseCssPx * viewportScale, profile.arcWidth.minimumCssPx, profile.arcWidth.maximumCssPx) * safeDpr,
    fontSize: profile.label.fontSizeCssPx * viewportScale * safeDpr,
    labelOffset: profile.label.offsetCssPx * viewportScale * safeDpr,
  };
}

export function formatRuntimeAngleLabel(valueDegrees: number | null): string | null {
  return valueDegrees === null || !Number.isFinite(valueDegrees) ? null : `${Math.round(valueDegrees)}°`;
}

function smallerArc(a: OverlayPoint, b: OverlayPoint, c: OverlayPoint, radius: number): RuntimeAngleArcGeometry | null {
  const ba = { x: a.x - b.x, y: a.y - b.y }; const bc = { x: c.x - b.x, y: c.y - b.y };
  if (![ba.x, ba.y, bc.x, bc.y, radius].every(Number.isFinite) || Math.hypot(ba.x, ba.y) <= 1e-6 || Math.hypot(bc.x, bc.y) <= 1e-6 || radius <= 0) return null;
  const first = Math.atan2(ba.y, ba.x); const third = Math.atan2(bc.y, bc.x);
  const positive = ((third - first) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const startAngle = positive <= Math.PI ? first : third;
  const endAngle = positive <= Math.PI ? third : first;
  const spanRadians = positive <= Math.PI ? positive : Math.PI * 2 - positive;
  return { center: b, radius, startAngle, endAngle, anticlockwise: false, spanRadians };
}

function bisector(a: OverlayPoint, b: OverlayPoint, c: OverlayPoint): OverlayPoint {
  const baLength = distance(a, b); const bcLength = distance(c, b);
  const x = (a.x - b.x) / baLength + (c.x - b.x) / bcLength;
  const y = (a.y - b.y) / baLength + (c.y - b.y) / bcLength;
  const magnitude = Math.hypot(x, y);
  if (magnitude > 1e-6) return { x: x / magnitude, y: y / magnitude };
  const fallbackX = -(a.y - b.y) / baLength; const fallbackY = (a.x - b.x) / baLength;
  return { x: fallbackX, y: fallbackY };
}

function overlaps(a: RuntimeAngleLabelBounds, b: RuntimeAngleLabelBounds) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function prepareAngleOverlay(canvas: HTMLCanvasElement, pose: AngleOverlayDisplayPose, results: readonly DisplayableAngleResult[], options: RuntimeAngleOverlayOptions): PreparedRuntimeAngleOverlay {
  const profile = options.profile ?? RUNTIME_ANGLE_OVERLAY_PROFILE; const scale = getRuntimeAngleOverlayDisplayScale(canvas, profile);
  const byId = new Map(results.map((result) => [result.metricId, result])); const acceptedBounds: RuntimeAngleLabelBounds[] = []; const metrics: PreparedRuntimeAngleOverlayMetric[] = [];
  const counts = { unavailableSkipped: 0, missingDisplayLandmarksSkipped: 0, identityMismatchSkipped: 0, degenerateGeometrySkipped: 0, collisionSuppressedLabels: 0 };
  for (const metricId of options.selectedMetricIds) {
    const definition = getJointAngleDefinition(metricId); if (!definition) throw new Error(`Unknown joint-angle metric ID: ${metricId}`);
    const result = byId.get(metricId); if (!result || result.status === "unavailable" || result.valueDegrees === null || result.coordinateSpace === null) { counts.unavailableSkipped += 1; continue; }
    if ((result.frameIndex !== undefined && pose.frameIndex !== undefined && result.frameIndex !== pose.frameIndex) || (result.cameraSessionId !== undefined && pose.cameraSessionId !== undefined && result.cameraSessionId !== pose.cameraSessionId) || (options.poseAgeMs ?? 0) > profile.maximumPoseAgeMs) { counts.identityMismatchSkipped += 1; continue; }
    const landmarks = definition.landmarks.map((id) => pose.landmarks2D[id]);
    if (landmarks.some((item, index) => !item || item.id !== definition.landmarks[index] || ![item.x, item.y].every(Number.isFinite))) { counts.missingDisplayLandmarksSkipped += 1; continue; }
    const points = landmarks.map((item) => projectProductionSkeletonPoint(canvas, item!, options)) as [OverlayPoint, OverlayPoint, OverlayPoint];
    const shortest = Math.min(distance(points[0], points[1]), distance(points[2], points[1]));
    const radius = clamp(shortest * profile.arcRadius.segmentRatio, profile.arcRadius.minimumCssPx * scale.devicePixelRatio, profile.arcRadius.maximumCssPx * scale.devicePixelRatio);
    const arc = smallerArc(points[0], points[1], points[2], radius); if (!arc) { counts.degenerateGeometrySkipped += 1; continue; }
    const displayValue = formatRuntimeAngleLabel(result.valueDegrees)!; const width = displayValue.length * scale.fontSize * 0.62 + profile.label.paddingXCssPx * 2 * scale.devicePixelRatio; const height = scale.fontSize + profile.label.paddingYCssPx * 2 * scale.devicePixelRatio;
    const direction = bisector(points[0], points[1], points[2]); const alternates = [direction, { x: -direction.y, y: direction.x }, { x: direction.y, y: -direction.x }, { x: -direction.x, y: -direction.y }];
    let labelBounds: RuntimeAngleLabelBounds | null = null; let labelAnchor: OverlayPoint | null = null;
    for (const candidate of alternates.slice(0, profile.label.maximumAttempts)) {
      const raw = { x: points[1].x + candidate.x * (radius + scale.labelOffset), y: points[1].y + candidate.y * (radius + scale.labelOffset) };
      const anchor = { x: clamp(raw.x, width / 2, canvas.width - width / 2), y: clamp(raw.y, height / 2, canvas.height - height / 2) };
      const bounds = { x: anchor.x - width / 2, y: anchor.y - height / 2, width, height };
      if (!acceptedBounds.some((existing) => overlaps(bounds, existing))) { labelAnchor = anchor; labelBounds = bounds; acceptedBounds.push(bounds); break; }
    }
    const labelVisible = labelBounds !== null; if (!labelVisible) counts.collisionSuppressedLabels += 1;
    metrics.push({ metricId, side: definition.side, status: result.status, valueDegrees: result.valueDegrees, displayValue, computationCoordinateSpace: result.coordinateSpace, points, vertex: points[1], arc: arc.spanRadians <= 1e-9 ? null : arc, labelAnchor, labelBounds, labelVisible, suppressionReason: labelVisible ? null : "collision" });
  }
  return Object.freeze({ metrics: Object.freeze(metrics), diagnostics: Object.freeze({ requestedMetricCount: options.selectedMetricIds.length, renderedArcCount: metrics.filter((item) => item.arc).length, renderedLabelCount: metrics.filter((item) => item.labelVisible).length, ...counts }) });
}

export function prepareRuntimeAngleOverlay(canvas: HTMLCanvasElement, pose: FilteredRuntimePose, results: readonly RuntimeJointAngleResult[], options: RuntimeAngleOverlayOptions) {
  return prepareAngleOverlay(canvas, pose, results, options);
}

export function prepareFormalAngleOverlay(canvas: HTMLCanvasElement, pose: AngleOverlayDisplayPose, results: readonly FormalJointAngleResult[], options: RuntimeAngleOverlayOptions) {
  return prepareAngleOverlay(canvas, pose, results, options);
}

function drawPreparedAngleOverlay(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, model: PreparedRuntimeAngleOverlay, options: RuntimeAngleOverlayOptions): PreparedRuntimeAngleOverlay {
  if (options.clear !== false) context.clearRect(0, 0, canvas.width, canvas.height);
  const profile = options.profile ?? RUNTIME_ANGLE_OVERLAY_PROFILE; const scale = getRuntimeAngleOverlayDisplayScale(canvas, profile);
  context.save();
  for (const item of model.metrics) {
    const statusStyle = item.status === "degraded" ? profile.degraded : profile.available;
    context.strokeStyle = profile.sideColors[item.side]; context.fillStyle = profile.labelTextColor; context.lineWidth = scale.arcWidth; context.globalAlpha = statusStyle.arcOpacity; context.setLineDash(item.status === "degraded" ? profile.degraded.dashCssPx.map((value) => value * scale.devicePixelRatio) : []);
    if (item.arc) { context.beginPath(); context.arc(item.arc.center.x, item.arc.center.y, item.arc.radius, item.arc.startAngle, item.arc.endAngle, item.arc.anticlockwise); context.stroke(); }
    if (item.labelVisible && item.labelAnchor && item.labelBounds) { context.setLineDash([]); context.globalAlpha = statusStyle.labelOpacity; context.fillStyle = profile.labelBackgroundColor; context.fillRect(item.labelBounds.x, item.labelBounds.y, item.labelBounds.width, item.labelBounds.height); context.font = `600 ${scale.fontSize}px system-ui, sans-serif`; context.textAlign = "center"; context.textBaseline = "middle"; context.fillStyle = profile.labelTextColor; context.fillText(item.displayValue, item.labelAnchor.x, item.labelAnchor.y); }
  }
  context.restore(); return model;
}

export function renderRuntimeAngleOverlay(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pose: FilteredRuntimePose, results: readonly RuntimeJointAngleResult[], options: RuntimeAngleOverlayOptions): PreparedRuntimeAngleOverlay {
  return drawPreparedAngleOverlay(canvas, context, prepareRuntimeAngleOverlay(canvas, pose, results, options), options);
}

export function renderFormalAngleOverlay(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pose: AngleOverlayDisplayPose, results: readonly FormalJointAngleResult[], options: RuntimeAngleOverlayOptions): PreparedRuntimeAngleOverlay {
  return drawPreparedAngleOverlay(canvas, context, prepareFormalAngleOverlay(canvas, pose, results, options), options);
}
