Use Case - Streaming ingestion with Apache Kafka
=========

This page provides documentation on how to use the FADI big data framework using a sample use case: monitoring CETIC offices building.

 * [1. Install FADI](#1-install-fadi)
 * [2. Prepare the database to store measurements](#2-prepare-the-database-to-store-measurements)
 * [3. Ingest and Digest measurements](#3-ingest-measurements)
 * [4. Display dashboards and configure alerts](#4-display-dashboards-and-configure-alerts)
 * [5. Explore](#5-explore)
 * [6. Process](#6-process)
 * [7. Summary](#7-summary)

![FADI sample use case - building monitoring](examples/kafka/images/uck.svg)

In this example, we will ingest temperature measurements from sensors and push them into the [Apache Kafka](https://kafka.apache.org) message broker.
We are then going to store the data from the broker into a database.
Finally, we display the temperature values in a simple dashboard.

## 1. Install FADI

To install the FADI framework on your workstation or on a cloud, see the [installation instructions](INSTALL.md).

The components needed for this use case are the following:

* Apache Nifi as a integration tool to ingest the sensor data from the data source (a csv file in this case) and push it into the broker. We also use Apache Nifi to get the data back from the broker ans store it into the database.
* Apache Kafka as a message broker.
* PostgreSQL as both a datawarehouse and datalake
* Gafana as a dashboard tool to display graphs from the data ingested and stored in the datalake
* Superset as a exploration dashboard tool
* Jupyter as a web interface to explore the data using notebooks

Those components are configured in the following [sample config file](examples/kafka/values.yaml).

Once the platform is ready, you can start working with it.

The following instructions assume that you deployed FADI on your workstation inside minikube.

Unless specified otherwise, all services can be accessed using the username and password pair: `admin` / `password1` , see the [user management documentation](doc/USERMANAGEMENT.md) for detailed information on how to configure user identification and authorization (LDAP, RBAC, ...).

See the [logs management documentation](doc/LOGGING.md) for information on how to configure the management of the various service logs.

## 2. Prepare the database to store measurements

<a href="https://www.pgadmin.org" alt="pgAdmin"><img src="doc/images/logos/pgadmin.png" width="200px" /></a>

First, setup the datalake by creating a table in the postgresql database.

To achieve this you need to:

* Head to the pgadmin interface, if you are using **minikube**, you can use the following command :
```
minikube service -n fadi fadi-pgadmin
```

* Access to the pgadmin service using the following credentials:
    * login: `pgadmin4@pgadmin.org`
    * password: `admin`

* In pgadmin Browser, create a server on pgadmin by right-click on `Servers` -> `Create a Server`

* Configure the server as shown in the following screenshot:
    * Host name: `fadi-postgresql`
    * Port: `5432`
    * Maintenance database: `postgres`
    * Username: `admin`
    * Password: `password1`
![Postgres Server](examples/kafka/images/pgadmin_create_server.png)

* Launch the Query tool.

<img src="examples/kafka/images/pgadmin_query_tool.png" width="300">


* Copy/Paste the [table creation script](examples/kafka/create_datalake_tables.sql) in the Query Editor.
![Postgres Server](examples/kafka/images/pgadmin_create_table.png)

* Execute the creation query by clicking on the `Execute/Refresh` command.
![Postgres Server](examples/kafka/images/pgadmin_execute_table.png)

* Once the previous steps are finished, you can detect that a new table `example_basic` is created in the `Tables` field of pgadmin Browser.

## 3 Prepare Nifi to inter-connect the different components.
<a href="http://nifi.apache.org/" alt="Apache Nifi"><img src="doc/images/logos/nifi.png" width="100px" /></a>

> "An easy to use, powerful, and reliable system to process and distribute data."

[Apache Nifi](http://nifi.apache.org/) provides mechanism (to e.g. connect a database, REST API, csv/json/avro files on a FTP, ...): in this case we want to read the temperature sensors data from our HVAC system and store it in a database while using a broker.

To start, head to the Nifi web interface, if you are using **minikube**, you can use the following command :
```
minikube service -n fadi fadi-nifi
```

![Nifi web interface](examples/kafka/images/nifi_interface.png)

For more information on how to use Apache Nifi, see the [official Nifi user guide](https://nifi.apache.org/docs/nifi-docs/html/user-guide.html) and this [Awesome Nifi](https://github.com/jfrazee/awesome-nifi) resources.

### 3.1 Measurements ingestion
Temperature measurements from the last 5 days (see [HVAC sample temperatures csv extract](examples/kafka/sample_data.csv)) are ingested:

```csv
measure_ts,temperature
2019-06-23 14:05:03.503,22.5
2019-06-23 14:05:33.504,22.5
2019-06-23 14:06:03.504,22.5
2019-06-23 14:06:33.504,22.5
2019-06-23 14:07:03.504,22.5
2019-06-23 14:07:33.503,22.5
2019-06-23 14:08:03.504,22.5
2019-06-23 14:08:33.504,22.5
(...)
```


Now we need to tell Nifi to read the csv file and push the measurements in broker.
So, create the following components :

#### Processors
To create processor, make a drag and drop from the following button :

<a href="https://grafana.com/" alt="Grafana"><img src="examples/kafka/images/nifi_processor.png" width="50px" /></a>

We need to configure two processors:

1. InvokeHTTP processor:
    * right-click on the processor > Click on `Configure` >
      - On the `Settings` tab > `Automatically Terminate Relationships` : all except `Response`
      - On the `Properties` tab > `Remote url`: `https://raw.githubusercontent.com/cetic/fadi/master/examples/kafka/sample_data.csv`
      - On the `Scheduling` tab > `Run Schedule`: 120s (this will download the sample file every 120 seconds)


2. PublishKafka processor:
    * right-click on the processor > Click on `Configure` > go to `Properties` tab >
      - `Kafka Brokers`: `fadi-kafka:9092`
      - `Topic Name`: `nifi-kafka`



#### Output Port
To create output port, make a drag and drop from the following button :

<a href="https://grafana.com/" alt="Grafana"><img src="examples/kafka/images/nifi_output.png" width="50px" /></a>

Create two output ports : `success_port` and `failure_port`

#### Connections

* `Response Connection`:
    * Create an edge from `InvokeHTTP` processor to `PublishKafka`
    * Details > For relationships > `Response`


* `Success` Connection:
    * Create an edge from `PutDatabaseRecord` to `Output Success Port`  
    * Details > relationships > only `success`    


* `Failure` Connection:
    * From `PutDatabaseRecord` to `Output Failure Port`
    * Details > relationships > : only `failure`   


Here is the result you need to arrive :

![Nifi Ingest CSV and store in PostgreSQL](examples/kafka/images/nifi_csv_to_kafka.png)

See also [the nifi Kafka_to_psql template](/examples/kafka/nifi_template_CSV_to_kafka.xml) that corresponds to this example.
* To reuse the provided template (instead of designing our own template), you can:
    * Click `Upload template` in the **Operate** frame, select the template, and upload it.
    * From the Nifi menu, drag and drop the **Template** menu.
    * Choose your uploaded template.

* right-click, and select `Start`.

### 3.2 Measurements digestion

#### Processors

To create the processor, drag and drop from the following button :

<a href="https://grafana.com/" alt="Grafana"><img src="examples/kafka/images/nifi_processor.png" width="50px" /></a>

We need to configure two processors:

1. `ConsumeKafka` processor
    * right-click on the processor > Click on `Configure` > go to `Properties` tab >
      - `Kafka Brokers`: `fadi-kafka:9092`
      - `Topic Name`: `nifi-kafka`
      - `Group ID`: `fadi`
      - `Offset Reset`: `earliest`


2. `PutDatabaseRecord` processor:
<ul>
  <li> right-click on the processor > Click on <code>Configure</code> > go to <code>Settings</code> tab > uncheck all the box on the list <code>Automatically Terminate Relationships</code></li>
  <br>
  <li> right-click on the processor > Click on  <code>Configure</code> > go to  <code>Properties</code> tab >
  <ul>
    <li> Statement Type: <code>INSERT</code></li>
    <li> Schema Name > <code>public</code></li>
    <li> Table Name > <code>example_basic</code></li>
    <li> Translate Field Names > <code>false</code></li>
  </ul>
  </li>
  <br>
  <li>right-click on the processor > Click on <code>Configure</code> > go to <code>Properties</code> tab  > Record Reader > <code>Create a new service</code> > <code>CSV Reader</code> > click on <code>Go To</code> (the litlle arrow on the right) > Click on <code>Configure</code>(the gear on the right side) > <code>Properties</code> > set <code>Treat First Line as Header</code> to <code>true</code></li>
 <br>
  <li> right-click on the processor > Click on <code>Configure</code> > go to <code>Properties</code> tab  > Database Connection Pooling Service > <code>DBCPConnectionPool</code> > Click on <code>Go To</code> (the litlle arrow on the right) > Click on <code>Configure</code>(the gear on the right side) > <code>Properties</code> > set up the following values:
    <ul>
      <li> Database Connection URL: <code>jdbc:postgresql://fadi-postgresql:5432/postgres?stringtype=unspecified</code></li>
      <li> Database Driver Class Name: <code>org.postgresql.Driver</code> </li>
      <li> Database Driver Location(s): <code>/opt/nifi/psql/postgresql-42.2.6.jar </code> </li>
      <li> Database User: <code>admin</code </li>
      <li> Password: <code> password1</code </li>
      <li> Enable service by clicking on the lightning icon.</li>
    </ul>
  </li>
</ul>

#### Output Port

To create output port, make a drag and drop from the following button :

<a href="https://grafana.com/" alt="Grafana"><img src="examples/kafka/images/nifi_output.png" width="50px" /></a>

Create two output ports : `success_port` and `failure_port`

#### Connections

* `Response Connection`:
    * Create an edge from `InvokeHTTP` processor to `PublishKafka`
    * Details > For relationships > `Response`

* `Success` Connection:
    * Create an edge from `PutDatabaseRecord` to `Output Success Port`  
    * Details > relationships > only `success`    

* `Failure` Connection:
    * From `PutDatabaseRecord` to `Output Failure Port`
    * Details > relationships > : only `failure`  


Here is the result you need to arrive :

![Nifi Ingest CSV and store in PostgreSQL](examples/kafka/images/nifi_kafka_to_sql.png)

See also [the nifi CSV_to_Kafka template](/examples/kafka/nifi_template_Kafka_to_psql.xml) that corresponds to this example.
* To reuse the provided template (instead of designing our own template), you can:
    * Click `Upload template` in the **Operate** frame, select the template, and upload it.
    * From the Nifi menu, drag and drop the **Template** menu.
    * Choose your uploaded template.
    * In the **Operate** frame of Nifi:
        * right-click on `Configuration`
        * Click on `View configuration` of `DBCPConnectionPool` controller service.
        * In the `Properties` tab, complete the `password` field with `password1`
        * Enable both `CSVReader` and `DBCPConnectionPool` controller services.

    * right-click, and select `Start`.

For more information on how to use Apache Nifi, see the [official Nifi user guide](https://nifi.apache.org/docs/nifi-docs/html/user-guide.html) and this [Awesome Nifi](https://github.com/jfrazee/awesome-nifi) resources.

Finally, **start** the Nifi flow in the **operate** window.

## 4. Display dashboards and configure alerts

Once the measurements are stored in the database, we will want to display the results in a dashboard.

<a href="https://grafana.com/" alt="Grafana"><img src="doc/images/logos/grafana.png" width="100px" /></a>

> "Grafana allows you to query, visualize, alert on and understand your metrics no matter where they are stored. Create, explore, and share dashboards with your team and foster a data driven culture."

[Grafana](http://grafana.com/) provides a dashboard and alerting interface.

Head to the Grafana interface, if you are using **minikube**, you can use the following command :
```
minikube service -n fadi fadi-grafana
```
(the default credentials are `admin`/`password1`)

![Grafana web interface](examples/kafka/images/grafana_interface.png)

First we will define the PostgreSQL datasource. To do that, in the Grafana Home Dashboard

* Select `Add data source`,
* Choose data source type: `PostgreSQL`,
* Complete the seeting as:
    * Host: `fadi-postgresql:5432`
    * database: `postgres`
    * user: `admin`
    * password: `password1`
    * SSL Mode: `disable`
    * Version: `10`

![Grafana datasource](examples/kafka/images/grafana_datasource.gif)

Then we will configure a simple dashboard that shows the temperatures captured in the PostgreSQL database:

* Select `New dashboard`,
* Select `Choose Visualization`

A pre-filled SQL query is provided and shown in the **Queries** tab.

You can complete the `Where` clause with the following expression: `Expr: temperature > 20` for example.

To show the dashboard, it is necessary to specify a time frame between `2019-06-23 16:00:00` and `2019-06-28 16:00:00`.

![Grafana dashboard](examples/kafka/images/grafana_time_frame.png)

Then, a diagram is displayed in the Grafana dashboard.

![Grafana dashboard](examples/kafka/images/grafana_dashboard.png)

And finally we will configure some alerts using very simple rules:
* Select `Alert` tab.
* Click on `Create Alert`
* Specify the alert threshold.
![Grafana alert](examples/kafka/images/grafana_alerting.png)

For more information on how to use Grafana, see the [official Grafana user guide](https://grafana.com/docs/guides/getting_started/)

## 5. Explore

<a href="https://superset.incubator.apache.org/" alt="Superset"><img src="doc/images/logos/superset.png" width="100px" /></a>

> "BI tool with a simple interface, feature-rich when it comes to views, that allows the user to create and share dashboards. This tool is simple and doesn’t require programming, and allows the user to explore, filter and organise data."

[Apache Superset](https://superset.incubator.apache.org) provides some interesting features to explore your data and build basic dashboards.

Head to the Superset interface, if you are using **minikube**, you can use the following command :
```
minikube service -n fadi fadi-superset
```
(the default credentials are `admin`/`password1`):

First we will define the datasource:

* On the top menu of Superset, click on `Sources` -> `Databases`

* Then, on the right, click on (+) (`add a new record` button).
    * Database: `example_basic`
    * SQLAlchemy URI: `postgresql://admin:password1@fadi-postgresql:5432/postgres`

* Finally, you can click on `Test Connection` to check to connection to the database.

![Superset datasource](examples/kafka/images/superset_datasource.png)

* Once the database is created, we can now create a table.
    * On the top menu of Superset, click on `Sources` -> `Tables`
    * Click on (+) (`add a new record` button).
    * Database: select `example_basic`.
    * Table name: `example_basic`.
    * Click `Save`.
    * On the table `example_basic`, click `Edit record` button.
    * On the `List Columns` tab, in the `measure_ts`, click on the `Edit record` button.
    * In the "Expression" box, enter `measure_ts ::timestamptz`.
    * Click `Save`.

![Superset table](examples/kafka/images/superset_table.gif)

Then we will explore our data and build a simple dashboard with the data that is inside the database:

* On the top menu of Superset, click on `Charts`
* Click on (+) (`add a new record` button).
* Choose a datasource: select `example_basic`.
* Choose a visualization type: `Time Series - Line Chart`.
* Click `Create new chart`.
* In the `Data` tab
    * in `Time` section,
       * Time Grain: `hour`.
       * Time range: `Last quarter`
    * in `Query` section
       * Metrics: `AVG(temperature)`
       * Click `Save`
* Then, in the main window of the dashboard, click on `Run Query`.

A diagram will be shown.

* We can now save the dashboard, by clicking on `Save`.
   * Save as: `Basic example`
   * Add to new dashboard: `Basic example dashboard`
   * Click on `Save & go to bashboard`.

![Superset dashboard](examples/kafka/images/superset_dashboard.gif)

For more information on how to use Superset, see the [official Superset user guide](https://superset.incubator.apache.org/tutorial.html)

## 6. Process

<a href="https://spark.apache.org/" alt="Apache Spark"><img src="doc/images/logos/spark.png" width="100px" /></a>

> "Apache Spark™ is a unified analytics engine for large-scale data processing."

[Jupyter](https://jupyter.org/) notebooks provide an easy interface to the [Spark](https://spark.apache.org/) processing engine that runs on your cluster.

In this simple use case, we will try to access the data that is stored in the data lake.

Head to the Jupyter notebook interface,  if you are using **minikube**, you can use the following command :
```
minikube service -n fadi proxy-public
```  
Then, you can login using the default credentials `admin`/`password1`.

A Jupyter dashboard is shown.

Choose `Minimal environment` and click on `Spawn`.

![Jupyter web interface](examples/kafka/images/jupyter_interface.png)

* You can now do some data exploration in the notebook
   * At first, you load the [sample code](examples/kafka/jupyter_exploration.ipynb):

![Jupyter exploration](examples/kafka/images/jupyter_exploration.gif)

   * Click on the `jupyter_exploration.ipynb` module and run the different scripts.
   * You should obtain results similar to that:

![Jupyter results1](examples/kafka/images/jupyter_results_1.png)
![Jupyter results2](examples/kafka/images/jupyter_results_2.png)

* Now, we will do some Spark processing in the notebook. Before starting, you need to change the environment. So:
   * Click on `Control panel`
   * Click on `Stop my server`
   * Finally, click on `Start server`, choose `Spark environment` and click on `Spawn`.

![Jupyter web interface](examples/kafka/images/spark_interface.png)

* You can now load the [sample code](examples/kafka/jupyter_spark.ipynb)
* Run the different scripts
* You should obtain results similar to that:

![Jupyter processing](examples/kafka/images/spark_results.png)

For more information on how to use Superset, see the [official Jupyter documentation](https://jupyter.readthedocs.io/en/latest/)

## 7. Summary

In this use case, we have demonstrated a simple configuration for FADI, where we use various services to ingest, store, analyse, explore and provide dashboards and alerts.