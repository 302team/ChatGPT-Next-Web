import { useCallback, useEffect, useMemo, useState } from "react";
import { getLang } from "../locales";
import { Col, Divider, Row, Space, Switch, Typography } from "antd";
import { Model, useAppConfig } from "../store/config";

function ModelItem(props: {
  model: Model;
  onChange?: (checked: boolean) => void;
}) {
  const lang = getLang();

  return (
    <Row wrap={false} align="middle">
      <Col flex="auto" style={{ paddingRight: "10px" }}>
        {props.model.show_name}
        {props.model.remark
          ? lang === "cn"
            ? ` (${props.model.remark})`
            : ` (${props.model.en_remark})`
          : null}
      </Col>
      <Col flex="none">
        <Switch
          checked={props.model.enable}
          onChange={(checked: boolean) => props.onChange?.(checked)}
        />
      </Col>
    </Row>
  );
}

export function SidebarModelList(props: { narrow?: boolean }) {
  const appConfig = useAppConfig();
  const models = appConfig.modelList;
  const lang = getLang();

  const modelList = useMemo(() => {
    const grouping: Record<string, Model[]> = {};

    models.forEach((m) => {
      const key = lang === "cn" ? m.model_type : m.en_model_type;

      if (!grouping[key]) {
        grouping[key] = [];
      }
      grouping[key].push(m);
    });

    return grouping;
  }, [models]);

  const onChange = useCallback(
    (checked: boolean, model: Model) => {
      const models = Object.values(modelList).flat();
      for (let i = 0; i < models.length; i++) {
        const item = models[i];
        if (item.id === model.id) {
          item.enable = checked;
          break;
        }
      }
      appConfig.update((config) => {
        config.modelList = models;
      });
    },
    [modelList],
  );

  return (
    <div style={{ paddingBottom: "20px" }}>
      <Space direction="vertical" size="small" style={{ display: "flex" }}>
        {Object.entries(modelList).map(([key, models], index) => (
          <div key={key}>
            <Divider style={{ marginTop: index === 0 ? "0" : "" }}>
              <Typography.Text type="secondary">{key}</Typography.Text>
            </Divider>
            <Space
              direction="vertical"
              size="small"
              style={{ display: "flex" }}
            >
              {models.map((model) => (
                <ModelItem
                  model={model}
                  key={model.id}
                  onChange={(checked: boolean) => {
                    onChange(checked, model);
                  }}
                />
              ))}
            </Space>
          </div>
        ))}
      </Space>
    </div>
  );
}
