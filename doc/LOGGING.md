Logs management
==========

<p align="left";>
	<a href="https://www.elastic.co" alt="elk">
	    <img src="/doc/images/logos/elk.png" align="center" alt="ELK logo" width="200px" />
    </a>
</p>

**[Elastic Stack](https://www.elastic.co)** is a group of open source products from Elastic designed to help users take data from any type of source and in any format and search, analyze, and visualize that data in real time. The product group is composed of: **Beats**, **Logstash**, **Elasticsearch** and **Kibana**.
Despite each one of these four technologies being a separate project, they have been built to work together:
 
* the process start with **[Beats](https://www.elastic.co/products/beats)**, it ships the logs from all services to 
* **[Logstash](https://www.elastic.co/products/logstash)**, which parses, filters or/and transforms the logs before storing them in 
* **[Elasticsearch](https://www.elastic.co/products/elasticsearch)** for indexing, which is connected to 
* **[Kibana](https://www.elastic.co/products/kibana)** that provides visualisation of the various services' logs in a central web application interface

![Elastic-stack](/doc/images/installation/elastic_stack.png)

To access the **Kibana** web interface, you have to go through the [nginx-ldapauth-proxy](###-LDAP-Authentication), you can use this command:

```
minikube service fadi-nginx-ldapauth-proxy
```

The next step is to **define your index pattern:** Index patterns tell Kibana which Elasticsearch indices you want to explore. An index pattern can match the name of a single index, or include a wildcard (`*`) to match multiple indices, for example, in our case the index we are using is `filebeat*` ([ref](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)).
To create the index pattern and monitor the logs, follow these simple steps:

1. In Kibana, open **Management** and then click **Index Patterns**.
2. If this is your first index pattern, the **Create index pattern** page opens automatically. Otherwise, click **Create index pattern**. 
3. Enter `filebeat*` in the Index pattern field.
  ![index_pattern](/doc/images/installation/index_pattern.png)

4. Click **Next step**.
5. In **Configure settings**, click **Create index pattern**.
	
	You are presented a table of all fields and associated data types in the index.
6. Open **Discover** and the logs will be displayed automatically.

	Your screen should look something like this:
	
  ![Kibana Logs](/doc/images/installation/kibana_logs.png)

For more details you can always visit the [Elastic-stack official documentation](https://www.elastic.co/guide/index.html).


### LDAP Authentication 
================

KIBANA is not compatible with ldap which means it can't be linked directly, to authenticate against the ldap server before accessing KIBANA we're using [nginx-ldap-auth](https://github.com/nginxinc/nginx-ldap-auth).
> The nginx-ldap-auth software is a reference implementation of a method for authenticating users who request protected resources from servers proxied by NGINX Plus. It includes a daemon (ldap-auth) that communicates with an authentication server which is in this case OpenLDAP.

The kibana service isn't accessible directly, to get to it you have to access nginx-ldap-auth, authenticate using your username/password and if successful you'll be redirected to the kibana service, to do so run this command:

```
minikube service fadi-nginx-ldapauth-proxy
```
for more info: [nginx plus authenticate users](https://www.nginx.com/blog/nginx-plus-authenticate-users/).

